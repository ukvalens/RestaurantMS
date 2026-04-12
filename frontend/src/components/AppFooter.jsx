const AppFooter = () => (
  <footer className="app-footer">
    <div className="footer-inner">
      <div className="footer-brand">🍴 <strong>RestaurantMS</strong> © {new Date().getFullYear()}</div>
      <div className="footer-contact">
        <span>👤 Ukwitegetse Valens</span>
        <span>✉️ <a href="mailto:ukwitegetsev9@gmail.com">ukwitegetsev9@gmail.com</a></span>
        <span>📞 <a href="tel:+250780468216">+250 780 468 216</a></span>
      </div>
    </div>
  </footer>
);

export default AppFooter;
