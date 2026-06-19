namespace VinhHy.NarrationAPI.Infrastructure.Services;

internal static class Mp3DurationDetector
{
    private static readonly int[] Mpeg1Layer3Bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
    private static readonly int[] Mpeg2Layer3Bitrates = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
    private static readonly int[] Mpeg1SampleRates = [44100, 48000, 32000];
    private static readonly int[] Mpeg2SampleRates = [22050, 24000, 16000];
    private static readonly int[] Mpeg25SampleRates = [11025, 12000, 8000];

    public static int? TryDetectDurationSeconds(string filePath)
    {
        try
        {
            using var stream = File.OpenRead(filePath);
            if (stream.Length <= 0)
            {
                return null;
            }

            SkipId3v2Tag(stream);

            var headerBuffer = new byte[4];
            var seconds = 0d;
            var frameCount = 0;

            while (stream.Position + headerBuffer.Length <= stream.Length)
            {
                var frameStart = stream.Position;
                if (stream.Read(headerBuffer, 0, headerBuffer.Length) != headerBuffer.Length)
                {
                    break;
                }

                if (!TryParseLayer3Frame(headerBuffer, out var frameSize, out var samplesPerFrame, out var sampleRate) ||
                    frameStart + frameSize > stream.Length)
                {
                    stream.Position = frameStart + 1;
                    continue;
                }

                seconds += (double)samplesPerFrame / sampleRate;
                frameCount++;
                stream.Position = frameStart + frameSize;
            }

            if (frameCount == 0 || seconds <= 0)
            {
                return null;
            }

            return Math.Max(1, (int)Math.Round(seconds, MidpointRounding.AwayFromZero));
        }
        catch (IOException)
        {
            return null;
        }
        catch (UnauthorizedAccessException)
        {
            return null;
        }
    }

    private static void SkipId3v2Tag(Stream stream)
    {
        Span<byte> header = stackalloc byte[10];
        if (stream.Read(header) != header.Length)
        {
            stream.Position = 0;
            return;
        }

        if (header[0] != 'I' || header[1] != 'D' || header[2] != '3')
        {
            stream.Position = 0;
            return;
        }

        var tagSize =
            ((header[6] & 0x7F) << 21) |
            ((header[7] & 0x7F) << 14) |
            ((header[8] & 0x7F) << 7) |
            (header[9] & 0x7F);

        stream.Position = Math.Min(stream.Length, 10L + tagSize);
    }

    private static bool TryParseLayer3Frame(
        byte[] headerBytes,
        out int frameSize,
        out int samplesPerFrame,
        out int sampleRate)
    {
        frameSize = 0;
        samplesPerFrame = 0;
        sampleRate = 0;

        var header =
            ((uint)headerBytes[0] << 24) |
            ((uint)headerBytes[1] << 16) |
            ((uint)headerBytes[2] << 8) |
            headerBytes[3];

        if ((header & 0xFFE00000) != 0xFFE00000)
        {
            return false;
        }

        var versionBits = (int)((header >> 19) & 0x3);
        var layerBits = (int)((header >> 17) & 0x3);
        var bitrateIndex = (int)((header >> 12) & 0xF);
        var sampleRateIndex = (int)((header >> 10) & 0x3);
        var padding = (int)((header >> 9) & 0x1);

        if (versionBits == 1 || layerBits != 1 || bitrateIndex is 0 or 15 || sampleRateIndex == 3)
        {
            return false;
        }

        var isMpeg1 = versionBits == 3;
        var bitrateKbps = isMpeg1 ? Mpeg1Layer3Bitrates[bitrateIndex] : Mpeg2Layer3Bitrates[bitrateIndex];
        sampleRate = versionBits switch
        {
            3 => Mpeg1SampleRates[sampleRateIndex],
            2 => Mpeg2SampleRates[sampleRateIndex],
            _ => Mpeg25SampleRates[sampleRateIndex]
        };

        samplesPerFrame = isMpeg1 ? 1152 : 576;
        frameSize = ((isMpeg1 ? 144000 : 72000) * bitrateKbps / sampleRate) + padding;

        return frameSize > headerBytes.Length && sampleRate > 0;
    }
}
