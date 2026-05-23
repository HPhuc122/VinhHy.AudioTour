using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using VinhHy.NarrationAPI.Application.Features.Auth.Validators;
using VinhHy.NarrationAPI.Application.Mapping;

namespace VinhHy.NarrationAPI.Application.DependencyInjection;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();
        services.AddAutoMapper(typeof(MappingProfile));
        return services;
    }
}
