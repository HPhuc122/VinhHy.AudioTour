using Xunit;

namespace VinhHy.NarrationAPI.SmokeTests;

[CollectionDefinition(Name)]
public class ApiCollection : ICollectionFixture<NarrationApiWebApplicationFactory>
{
    public const string Name = "NarrationApi";
}
