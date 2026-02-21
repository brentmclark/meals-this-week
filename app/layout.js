import "./globals.css";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "Meals This Week",
  description: "Family weekly dinner planner"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="o-pageWrap">
          <header className="o-siteHeader">
            <div className="o-container">
              <NavBar />
            </div>
          </header>
          <main className="o-siteBody">
            <div className="o-container o-stack">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
