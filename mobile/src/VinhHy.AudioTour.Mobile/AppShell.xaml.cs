using VinhHy.AudioTour.Mobile.Views;

namespace VinhHy.AudioTour.Mobile;

public partial class AppShell : Shell
{
    public AppShell(HomePage homePage, SyncStatusPage syncStatusPage, SettingsPage settingsPage)
    {
        InitializeComponent();

        var tabBar = new TabBar();
        tabBar.Items.Add(new ShellContent
        {
            Title = "Home",
            Content = homePage,
            Route = "home"
        });
        tabBar.Items.Add(new ShellContent
        {
            Title = "Sync",
            Content = syncStatusPage,
            Route = "sync"
        });
        tabBar.Items.Add(new ShellContent
        {
            Title = "Settings",
            Content = settingsPage,
            Route = "settings"
        });

        Items.Add(tabBar);
    }
}
