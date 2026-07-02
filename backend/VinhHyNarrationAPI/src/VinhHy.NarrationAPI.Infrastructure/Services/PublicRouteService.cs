using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.PublicRoutes.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;
using VinhHy.NarrationAPI.Domain.Specifications;
using VinhHy.NarrationAPI.Infrastructure.Data;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class PublicRouteService(
    ApplicationDbContext db,
    HttpClient httpClient,
    IConfiguration configuration) : IPublicRouteService
{
    private const string DirectionsUrl = "https://api.openrouteservice.org/v2/directions/driving-car";

    private readonly string? _apiKey = configuration["OpenRouteService:ApiKey"]
        ?? configuration["ORS_API_KEY"]
        ?? "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjcwN2MyZTA0Y2JjODQ0OTg4NWM4OTk3MjIwOTE4NTlmIiwiaCI6Im11cm11cjY0In0=";

    public async Task<PoiToPoiRouteDto> GetPoiToPoiRouteAsync(
        int fromPoiId,
        int toPoiId,
        CancellationToken cancellationToken = default)
    {
        if (fromPoiId <= 0)
        {
            throw new ValidationException(nameof(fromPoiId), "fromPoiId must be greater than 0.");
        }

        if (toPoiId <= 0)
        {
            throw new ValidationException(nameof(toPoiId), "toPoiId must be greater than 0.");
        }

        if (fromPoiId == toPoiId)
        {
            throw new ValidationException(nameof(toPoiId), "Please choose two different POIs.");
        }

        var now = DateTime.UtcNow;
        var pois = await db.Pois
            .AsNoTracking()
            .Where(p => p.Id == fromPoiId || p.Id == toPoiId)
            .Where(PoiAvailability.IsPubliclyAvailable(now))
            .Select(p => new PoiCoordinate(p.Id, (double)p.Latitude, (double)p.Longitude))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var fromPoi = pois.FirstOrDefault(p => p.Id == fromPoiId);
        var toPoi = pois.FirstOrDefault(p => p.Id == toPoiId);

        if (fromPoi is null)
        {
            throw new NotFoundException("Public POI", fromPoiId);
        }

        if (toPoi is null)
        {
            throw new NotFoundException("Public POI", toPoiId);
        }

        var route = await GetDrivingRouteAsync(fromPoi, toPoi, cancellationToken).ConfigureAwait(false);

        return new PoiToPoiRouteDto
        {
            FromPoiId = fromPoiId,
            ToPoiId = toPoiId,
            DirectDistanceMeters = GetDistanceMeters(fromPoi.Latitude, fromPoi.Longitude, toPoi.Latitude, toPoi.Longitude),
            RouteDistanceMeters = route.DistanceMeters,
            DurationSeconds = route.DurationSeconds,
            LatLngs = route.LatLngs
        };
    }

    private async Task<RouteResult> GetDrivingRouteAsync(
        PoiCoordinate fromPoi,
        PoiCoordinate toPoi,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new AppException("OpenRouteService API key is not configured.", statusCode: 503);
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, DirectionsUrl)
        {
            Content = JsonContent.Create(new OrsDirectionsRequest(
                [[fromPoi.Longitude, fromPoi.Latitude], [toPoi.Longitude, toPoi.Latitude]],
                Instructions: false))
        };
        request.Headers.TryAddWithoutValidation("Authorization", _apiKey);

        using var response = await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        var data = await response.Content
            .ReadFromJsonAsync<OrsDirectionsResponse>(cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            throw new AppException(GetRouteErrorMessage(response.StatusCode, data), (int)response.StatusCode);
        }

        var route = data?.Routes?.FirstOrDefault();
        var feature = data?.Features?.FirstOrDefault();
        var geometry = route?.Geometry;
        var summary = route?.Summary ?? feature?.Properties?.Summary;
        var latLngs = DecodeGeometry(geometry ?? feature?.Geometry);

        if (latLngs.Count < 2)
        {
            throw new AppException("No suitable route was found between the selected POIs.", statusCode: 404);
        }

        return new RouteResult(
            latLngs,
            summary?.Distance ?? 0,
            summary?.Duration ?? 0);
    }

    private static string GetRouteErrorMessage(System.Net.HttpStatusCode statusCode, OrsDirectionsResponse? data)
    {
        var apiMessage = data?.GetErrorMessage();
        return statusCode switch
        {
            System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden =>
                "The OpenRouteService API key is invalid or does not have access.",
            System.Net.HttpStatusCode.NotFound =>
                "No suitable route was found between the selected POIs.",
            (System.Net.HttpStatusCode)429 =>
                "OpenRouteService is rate-limiting requests. Please try again later.",
            _ => string.IsNullOrWhiteSpace(apiMessage)
                ? $"OpenRouteService error: {(int)statusCode}"
                : apiMessage
        };
    }

    private static double GetDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusMeters = 6371000;
        static double ToRad(double value) => value * Math.PI / 180;

        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        return (earthRadiusMeters * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a)));
    }

    private static IReadOnlyList<RouteLatLngDto> DecodeOrsPolyline(string encoded)
    {
        var coordinates = new List<RouteLatLngDto>();
        var index = 0;
        var latitude = 0;
        var longitude = 0;

        while (index < encoded.Length)
        {
            var latitudeChange = DecodePolylineValue(encoded, index);
            index = latitudeChange.NextIndex;
            var longitudeChange = DecodePolylineValue(encoded, index);
            index = longitudeChange.NextIndex;
            latitude += latitudeChange.Value;
            longitude += longitudeChange.Value;
            coordinates.Add(new RouteLatLngDto
            {
                Latitude = latitude / 1e5,
                Longitude = longitude / 1e5
            });
        }

        return coordinates;
    }

    private static IReadOnlyList<RouteLatLngDto> DecodeGeometry(JsonElement? geometry)
    {
        if (!geometry.HasValue || geometry.Value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
        {
            return [];
        }

        if (geometry.Value.ValueKind == JsonValueKind.String)
        {
            var encoded = geometry.Value.GetString();
            return string.IsNullOrWhiteSpace(encoded) ? [] : DecodeOrsPolyline(encoded);
        }

        if (geometry.Value.ValueKind != JsonValueKind.Object ||
            !geometry.Value.TryGetProperty("coordinates", out var coordinates) ||
            coordinates.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var result = new List<RouteLatLngDto>();
        foreach (var coordinate in coordinates.EnumerateArray())
        {
            if (coordinate.ValueKind != JsonValueKind.Array || coordinate.GetArrayLength() < 2)
            {
                continue;
            }

            result.Add(new RouteLatLngDto
            {
                Latitude = coordinate[1].GetDouble(),
                Longitude = coordinate[0].GetDouble()
            });
        }

        return result;
    }

    private static (int Value, int NextIndex) DecodePolylineValue(string encoded, int startIndex)
    {
        var index = startIndex;
        var result = 0;
        var shift = 0;
        int value;

        do
        {
            if (index >= encoded.Length)
            {
                throw new AppException("OpenRouteService returned invalid route geometry.", statusCode: 502);
            }

            value = encoded[index++] - 63;
            result |= (value & 0x1f) << shift;
            shift += 5;
        } while (value >= 0x20);

        return ((result & 1) != 0 ? ~(result >> 1) : result >> 1, index);
    }

    private sealed record PoiCoordinate(int Id, double Latitude, double Longitude);

    private sealed record RouteResult(
        IReadOnlyList<RouteLatLngDto> LatLngs,
        double DistanceMeters,
        double DurationSeconds);

    private sealed record OrsDirectionsRequest(
        [property: JsonPropertyName("coordinates")] double[][] Coordinates,
        [property: JsonPropertyName("instructions")] bool Instructions);

    private sealed class OrsDirectionsResponse
    {
        [JsonPropertyName("routes")]
        public List<OrsRoute>? Routes { get; set; }

        [JsonPropertyName("features")]
        public List<OrsFeature>? Features { get; set; }

        [JsonPropertyName("error")]
        public JsonElement? Error { get; set; }

        public string? GetErrorMessage()
        {
            if (!Error.HasValue || Error.Value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            {
                return null;
            }

            if (Error.Value.ValueKind == JsonValueKind.String)
            {
                return Error.Value.GetString();
            }

            return Error.Value.ValueKind == JsonValueKind.Object &&
                Error.Value.TryGetProperty("message", out var message) &&
                message.ValueKind == JsonValueKind.String
                    ? message.GetString()
                    : null;
        }
    }

    private sealed class OrsRoute
    {
        [JsonPropertyName("geometry")]
        public JsonElement? Geometry { get; set; }

        [JsonPropertyName("summary")]
        public OrsSummary? Summary { get; set; }
    }

    private sealed class OrsFeature
    {
        [JsonPropertyName("geometry")]
        public JsonElement? Geometry { get; set; }

        [JsonPropertyName("properties")]
        public OrsFeatureProperties? Properties { get; set; }
    }

    private sealed class OrsFeatureProperties
    {
        [JsonPropertyName("summary")]
        public OrsSummary? Summary { get; set; }
    }

    private sealed class OrsSummary
    {
        [JsonPropertyName("distance")]
        public double Distance { get; set; }

        [JsonPropertyName("duration")]
        public double Duration { get; set; }
    }

}
