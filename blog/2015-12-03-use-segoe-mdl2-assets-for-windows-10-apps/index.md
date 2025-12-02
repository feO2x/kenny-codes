---
slug: 2015-12-03-use-segoe-mdl2-assets-for-windows-10-apps
title: Use Segoe MDL2 Assets for Windows 10 Apps
authors: [feO2x]
tags: [windows-10, uwp, xaml, design]
---

Are you writing Windows 10 Apps already? I'm currently updating one app from Windows 8.1 Store to the Universal Windows Platform, which of course means that some redesign is required, too. If you ever have developed a Windows Store App, you probably know the Segoe UI Symbol font because it offers a lot of icons that you can use for e.g. buttons in the app bar. The benefit is clear: you do not have to create these icons by yourself, they fit within the overall design of Windows and you can scale them however you want because it's a font – it's always rendered crisp and sharp.

<!-- truncate -->

Of course, I started using Segoe UI Symbol in my upgraded UWP App, too, but when I compared my design to that of the apps that come with Windows 10, I noticed a difference which has the following cause: Segoe UI Symbol is not the primary font for icons in UWP. Instead, Microsoft introduced a new font called [Segoe MDL2 Assets](https://learn.microsoft.com/en-us/windows/apps/design/style/segoe-ui-symbol-font) that one should use for Windows 10 Apps. You can also use the [Symbol enumeration](https://learn.microsoft.com/en-us/uwp/api/windows.ui.xaml.controls.symbol?view=winrt-26100) to access these icons directly without the need to use the Character Map and fiddling with the Unicode characters.

So, if you develop for Windows 10, keep in mind to use Segoe MDL2 Assets as your icon font.
