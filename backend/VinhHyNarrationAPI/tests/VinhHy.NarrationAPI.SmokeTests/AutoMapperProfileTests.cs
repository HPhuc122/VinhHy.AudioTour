using AutoMapper;
using VinhHy.NarrationAPI.Application.Mapping;
using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

public class AutoMapperProfileTests
{
    [Fact]
    public void MappingProfile_ConfigurationIsValid()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        config.AssertConfigurationIsValid();
    }
}
