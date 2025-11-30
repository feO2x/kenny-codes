import Layout from "@theme/Layout";

export default function LegalNotice() {
  return (
    <Layout
      title="Legal Notice"
      description="Legal Notice and Contact Information"
    >
      <main className="container margin-vert--lg">
        <h1>Legal Notice</h1>
        <h2>Contact</h2>
        <p>
          Kenny Pflug - Kenny Codes<br />
          Würzburger Str. 10<br />
          93059 Regensburg<br />
          Germany<br />
          <a href="mailto:info@kennycodes.net">info@kennycodes.net</a>
        </p>
        <h2>Disclaimer</h2>
        <p>
          The information provided on this website is for general informational
          purposes only. While we strive to keep the information up to date and
          accurate, we make no representations or warranties of any kind,
          express or implied, about the completeness, accuracy, reliability,
          suitability, or availability with respect to the website or the
          information, products, services, or related graphics contained on the
          website for any purpose. Any reliance you place on such information is
          therefore strictly at your own risk.
        </p>
        <p>
          In no event will we be liable for any loss or damage including without
          limitation, indirect or consequential loss or damage, or any loss or
          damage whatsoever arising from loss of data or profits arising out of,
          or in connection with, the use of this website.
        </p>
        <p>
          Through this website you are able to link to other websites which are
          not under the control of Kenny Pflug. We have no control over the
          nature, content and availability of those sites. The inclusion of any
          links does not necessarily imply a recommendation or endorse the views
          expressed within them.
        </p>
        <p>
          Every effort is made to keep the website up and running smoothly.
          However, Kenny Pflug takes no responsibility for, and will not be
          liable for, the website being temporarily unavailable due to technical
          issues beyond our control.
        </p>
      </main>
    </Layout>
  );
}
