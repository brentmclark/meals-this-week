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
        <main>
          <NavBar />
          {children}
        </main>
      </body>
    </html>
  );
}
