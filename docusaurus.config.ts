import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const description =
  "Personal website of Kenny Pflug, a software engineer from Regensburg, Germany, specializing in .NET internals, software design and architecture, distributed systems, and ASP.NET Core backends.";
const socialCardImageUrl = "https://feO2x.github.io/kenny-codes/img/kenny-codes-social-card.jpg";

const config: Config = {
  title: "Kenny Codes",
  tagline:
    "Distributed systems, software architecture and design, .NET internals, and other software engineering topics 🚀",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://feO2x.github.io/",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/kenny-codes/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "feO2x", // Usually your GitHub org/user name.
  projectName: "kenny-codes", // Usually your repo name.

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "@docusaurus/plugin-ideal-image",
      {
        quality: 85,
        max: 1920, // max resized image's size.
        min: 320, // min resized image's size. if original is lower, use that size.
        steps: 4, // the max number of images generated between min and max (inclusive)
        disableInDev: false,
      },
    ],
  ],

  themeConfig: {
    image: "img/kenny-codes-social-card.jpg",
    metadata: [
      {
        name: "keywords",
        content:
          ".NET, ASP.NET Core, C#, software performance, distributed systems, system architecture, API design, scalability, cloud-native, concurrency, resilience, software design, software architecture, programming, coding",
      },
      {
        name: "author",
        content: "Kenny Pflug",
      },
      {
        name: "description",
        content: description,
      },
      {
        name: "category",
        content: "technology, programming, software development",
      },
      {
        name: "robots",
        content:
          "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:160",
      },
      {
        name: "format-detection",
        content: "telephone=no, address=no, email=no",
      },
      {
        name: "og:title",
        content: "Kenny Codes",
      },
      {
        name: "og:description",
        content: description,
      },
      {
        name: "og:url",
        content: "https://feO2x.github.io/kenny-codes/",
      },
      {
        name: "og:site_name",
        content: "Kenny Codes",
      },
      {
        name: "og:locale",
        content: "en_IE",
      },
      {
        name: "og:image",
        content: socialCardImageUrl,
      },
      {
        name: "og:image:width",
        content: "800",
      },
      {
        name: "og:image:height",
        content: "418",
      },
      {
        name: "og:image:alt",
        content: "Kenny Codes",
      },
      {
        name: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:site",
        content: "@feO2x",
      },
      {
        name: "twitter:creator",
        content: "@feO2x",
      },
      {
        name: "twitter:title",
        content: "Kenny Codes",
      },
      {
        name: "twitter:description",
        content: description,
      },
      {
        name: "twitter:image",
        content: socialCardImageUrl,
      },
      {
        name: "referrer",
        content: "no-referrer-when-downgrade",
      }
    ],
    navbar: {
      title: "Kenny Codes",
      logo: {
        alt: "Kenny Codes Logo",
        src: "img/logo-light.svg",
        srcDark: "img/logo-dark.svg",
      },
      items: [
        {
          to: "/events",
          label: "Events",
          position: "left",
        },
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Tutorial",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://github.com/facebook/docusaurus",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Tutorial",
              to: "/docs/intro",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Stack Overflow",
              href: "https://stackoverflow.com/questions/tagged/docusaurus",
            },
            {
              label: "Discord",
              href: "https://discordapp.com/invite/docusaurus",
            },
            {
              label: "X",
              href: "https://x.com/docusaurus",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "GitHub",
              href: "https://github.com/facebook/docusaurus",
            },
          ],
        },
      ],
      copyright: `Copyright © 2025 Kenny Pflug. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
