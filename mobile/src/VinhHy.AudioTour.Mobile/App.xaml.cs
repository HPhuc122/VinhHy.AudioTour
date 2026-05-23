using VinhHy.AudioTour.Mobile.Core.Contracts.Services;

namespace VinhHy.AudioTour.Mobile;

public partial class App : Application
{
    private readonly IAppBootstrapService _bootstrapService;
    private readonly AppShell _appShell;

    public App(IAppBootstrapService bootstrapService, AppShell appShell)
    {
        _bootstrapService = bootstrapService;
        _appShell = appShell;
        InitializeComponent();
    }

    protected override async void OnStart()
    {
        base.OnStart();

        try
        {
            await _bootstrapService.BootstrapAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Bootstrap failed: {ex}");
        }
    }

    protected override Window CreateWindow(IActivationState? activationState) =>
        new Window(_appShell);
}
