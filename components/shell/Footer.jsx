export function Footer() {
  const year = new Date().getFullYear();
  return (
    <div className="footer">
      <div className="fuel-logo">
        <img src="/logo-black.svg" alt="Fuel" />
      </div>
      <div className="footer-links">
        <a href="#">Confidential</a>
        <a href="#">Fuel Finance © {year}</a>
        <a href="https://fuelfinance.me">fuelfinance.me</a>
      </div>
    </div>
  );
}
