export interface Event {
  title: string;
  type: string;
  duration?: string;
  language: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  location: string;
  country?: string;
  event: string;
  description: string;
  tags: string[];
  url: string;
}

export const events: Event[] = [
  {
    "title": "Async Workshop: Clarity in Asynchrony – async await Internals and Expert Knowledge for Scalable .NET Apps",
    "type": "Workshop",
    "duration": "8h",
    "language": "German",
    "startDate": "2024-09-16",
    "endDate": "2024-09-20",
    "location": "Mainz",
    "country": "Germany",
    "event": "BASTA! Autumn 2024",
    "description": "Workshop focusing on async/await internals and expert knowledge for scalable .NET applications.",
    "tags": ["async-await", ".NET", "performance", "scalability"],
    "url": "https://www.thinktecture.com/contributions/async-workshop-klarheit-in-der-asynchronitaet-async-await-internals-und-expertenwissen-fuer-skalierbare-net-apps/"
  },
  {
    "title": ".NET Native AOT – Ready for My Web APIs?",
    "type": "Talk",
    "language": "German",
    "startDate": "2024-09-16",
    "endDate": "2024-09-20",
    "location": "Mainz",
    "country": "Germany",
    "event": "BASTA! Autumn 2024",
    "description": "Exploring whether .NET Native AOT is ready for your Web APIs.",
    "tags": ["Native AOT", ".NET", "Web APIs", "performance"],
    "url": "https://www.thinktecture.com/contributions/net-native-aot-bereit-fuer-meine-web-apis/"
  },
  {
    "title": "Web APIs with ASP.NET Core Native AOT",
    "type": "Talk",
    "language": "German",
    "startDate": "2024-07-01",
    "endDate": "2024-07-05",
    "location": "Nuremberg",
    "country": "Germany",
    "event": "DWX 2024",
    "description": "Building Web APIs with ASP.NET Core Native AOT compilation.",
    "tags": ["ASP.NET Core", "Native AOT", "Web APIs"],
    "url": "https://www.thinktecture.com/contributions/web-apis-mit-asp-net-core-native-aot/"
  },
  {
    "title": "Private GPT LLMs: Securely Deploying Azure OpenAI Service with Terraform",
    "type": "Talk",
    "language": "German",
    "startDate": "2024-07-01",
    "endDate": "2024-07-05",
    "location": "Nuremberg",
    "country": "Germany",
    "event": "DWX 2024",
    "description": "Securely deploying Azure OpenAI Service with Terraform for private GPT LLMs.",
    "tags": ["Azure", "OpenAI", "Terraform", "Security"],
    "url": "https://www.thinktecture.com/contributions/private-gpt-llms-azure-openai-service-sicher-deployen-mit-terraform-2/"
  },
  {
    "title": "Scalable .NET Apps with async await",
    "type": "Talk",
    "language": "German",
    "startDate": "2024-05-06",
    "endDate": "2024-05-08",
    "location": "Regensburg",
    "country": "Germany",
    "event": "Advanced Developers Conference 2024",
    "description": "Building scalable .NET applications using async/await patterns.",
    "tags": ["async-await", ".NET", "scalability"],
    "url": "https://www.thinktecture.com/contributions/skalierbare-net-apps-mit-async-await/"
  },
  {
    "title": "Web APIs with ASP.NET Core Native AOT",
    "type": "Talk",
    "language": "German",
    "startDate": "2024-05-06",
    "endDate": "2024-05-08",
    "location": "Regensburg",
    "country": "Germany",
    "event": "Advanced Developers Conference 2024",
    "description": "Building Web APIs with ASP.NET Core Native AOT compilation.",
    "tags": ["ASP.NET Core", "Native AOT", "Web APIs"],
    "url": "https://www.thinktecture.com/contributions/web-apis-mit-asp-net-core-native-aot-2/"
  },
  {
    "title": "Securely Deploying Private OpenAI LLMs in Azure with Terraform",
    "type": "Talk",
    "language": "German",
    "startDate": "2024-02-27",
    "endDate": "2024-02-27",
    "location": "Online",
    "event": "Digital Craftsmanship Nordoberpfalz Meetup February 2024",
    "description": "Securely deploying private OpenAI LLMs in Azure using Terraform.",
    "tags": ["Azure", "OpenAI", "Terraform", "Security"],
    "url": "https://www.thinktecture.com/contributions/private-openai-llms-sicher-deployen-in-azure-mit-terraform/"
  },
  {
    "title": "Scalable .NET Apps with async await – Fundamentals & Practical Tips",
    "type": "Talk",
    "language": "German",
    "startDate": "2024-02-12",
    "endDate": "2024-02-16",
    "location": "Frankfurt",
    "country": "Germany",
    "event": "BASTA! Spring 2024",
    "description": "Fundamentals and practical tips for building scalable .NET apps with async/await.",
    "tags": ["async-await", ".NET", "scalability", "best-practices"],
    "url": "https://www.thinktecture.com/contributions/skalierbare-net-apps-mit-async-await-grundlagen-tipps-aus-der-praxis/"
  },
  {
    "title": "Private GPT LLMs: Securely Deploying Azure OpenAI Service with Terraform",
    "type": "Talk",
    "language": "German",
    "startDate": "2024-02-12",
    "endDate": "2024-02-16",
    "location": "Frankfurt",
    "country": "Germany",
    "event": "BASTA! Spring 2024",
    "description": "Securely deploying Azure OpenAI Service with Terraform for private GPT LLMs.",
    "tags": ["Azure", "OpenAI", "Terraform", "Security"],
    "url": "https://www.thinktecture.com/contributions/private-gpt-llms-azure-openai-service-sicher-deployen-mit-terraform/"
  },
  {
    "title": "Cloud-Native in Practice: Modern End-to-End Architectures",
    "type": "Workshop",
    "duration": "8h",
    "language": "German",
    "startDate": "2023-09-25",
    "endDate": "2023-09-29",
    "location": "Mainz",
    "country": "Germany",
    "event": "BASTA! Autumn 2023",
    "description": "Practical cloud-native development with modern end-to-end architectures.",
    "tags": ["Cloud-Native", "Architecture", "Kubernetes"],
    "url": "https://www.thinktecture.com/contributions/cloud-native-in-der-praxis-moderne-end-to-end-architekturen/"
  },
  {
    "title": ".NET Native AOT – Data Access without EF Core, Using Humble Objects Instead",
    "type": "Webinar",
    "language": "German",
    "startDate": "2024-03-20",
    "startTime": "10:30",
    "location": "Online",
    "event": "Thinktecture Webinar",
    "description": "Data access in .NET Native AOT without EF Core, using Humble Objects pattern.",
    "tags": ["Native AOT", ".NET", "Data Access", "Humble Objects"],
    "url": "https://www.thinktecture.com/webinare/net-native-aot-data-access-ohne-ef-core-dafuer-mit-humble-objects/"
  },
  {
    "title": ".NET Native AOT – Overview and Performance",
    "type": "Webinar",
    "language": "German",
    "startDate": "2024-03-06",
    "startTime": "10:30",
    "location": "Online",
    "event": "Thinktecture Webinar",
    "description": "Overview and performance aspects of .NET Native AOT.",
    "tags": ["Native AOT", ".NET", "Performance"],
    "url": "https://www.thinktecture.com/webinare/net-native-aot-uebersicht-und-performance/"
  }
];
