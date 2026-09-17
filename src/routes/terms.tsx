import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Shell } from "@/components/glass";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | CivicDesk" },
      {
        name: "description",
        content:
          "The terms that govern your use of CivicDesk, the personal document and deadline management app by Stratustal.",
      },
      { property: "og:title", content: "Terms of Service | CivicDesk" },
      { property: "og:description", content: "The terms governing your use of CivicDesk." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <Shell>
      <main className="safe-top px-5 pb-16">
        <Link
          to="/"
          className="press glass mb-5 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="mb-1 text-2xl font-bold text-foreground">Terms of Service</h1>
        <p className="mb-6 text-xs text-foreground/50">Last updated 16 September 2026</p>

        <div className="space-y-5 text-sm leading-relaxed text-foreground/75">
          <section>
            <h2 className="mb-1 font-semibold text-foreground">1. Agreement</h2>
            <p>
              These Terms of Service form an agreement between you and Stratustal ("we", "us"),
              the provider of CivicDesk. By creating an account or using the app you accept these
              terms. If you do not accept them, please do not use CivicDesk.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">2. The service</h2>
            <p>
              CivicDesk is a personal document management tool. It lets you store copies of
              documents such as receipts, warranties, subscription confirmations, gift cards and
              identity paperwork, extracts key details from them, records deadlines and, at your
              request, adds those deadlines to your Google Calendar.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">3. Your account</h2>
            <p>
              You must be at least 16 years old to use CivicDesk. You are responsible for keeping
              your password and your device PIN confidential and for all activity that takes place
              under your account. Tell us promptly if you believe your account has been accessed
              without your permission.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">4. Your content</h2>
            <p>
              You keep full ownership of every document, image and detail you add to CivicDesk. You
              grant us only the limited permission needed to store, process and display that content
              back to you, including sending it to our document-reading provider so that dates and
              details can be extracted. You confirm you have the right to upload the content you
              add.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">5. Acceptable use</h2>
            <p>
              Do not use CivicDesk to store unlawful material, to infringe the rights of others, to
              attempt to access another user's data, or to disrupt, probe or overload the service.
              We may suspend accounts that breach these rules.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">6. Automated reading and reminders</h2>
            <p>
              Details and dates extracted from your documents are produced automatically and may be
              incomplete or incorrect. You can edit every field before saving. CivicDesk is an
              organisational aid, not legal, financial or tax advice, and you remain responsible for
              meeting your own deadlines.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">7. Availability and changes</h2>
            <p>
              We work to keep CivicDesk available and accurate, but the service is provided on an
              "as is" basis without warranties of any kind. We may add, change or withdraw features,
              and we will give reasonable notice of significant changes where we can.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">8. Liability</h2>
            <p>
              To the fullest extent permitted by law, we are not liable for indirect or consequential
              loss, or for any missed deadline, lapsed warranty, expired return window or other
              outcome arising from your use of, or inability to use, CivicDesk.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">9. Ending your use</h2>
            <p>
              You may stop using CivicDesk and request deletion of your account and stored documents
              at any time. We may suspend or end access where these terms are breached or where we
              are required to do so by law.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">10. Contact</h2>
            <p>
              Questions about these terms can be sent to us through the support channel listed on our
              website. Read our{" "}
              <Link to="/privacy" className="font-medium text-primary">
                Privacy Policy
              </Link>{" "}
              for how we handle your data.
            </p>
          </section>
        </div>
      </main>
    </Shell>
  );
}
