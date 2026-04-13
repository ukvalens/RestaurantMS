const AppFooter = () => (
  <footer className="app-footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <i className="fa-solid fa-utensils" style={{ marginRight: '0.4rem' }} />
        <strong>RestaurantMS</strong> © {new Date().getFullYear()}
      </div>
      <div className="footer-contact">
        <span><i className="fa-solid fa-user" style={{ marginRight: '0.3rem' }} />Ukwitegetse Valens</span>
        <span><i className="fa-solid fa-envelope" style={{ marginRight: '0.3rem' }} /><a href="mailto:ukwitegetsev9@gmail.com">ukwitegetsev9@gmail.com</a></span>
        <span><i className="fa-solid fa-phone" style={{ marginRight: '0.3rem' }} /><a href="tel:+250780468216">+250 780 468 216</a></span>
      </div>
    </div>
  </footer>
);

export default AppFooter;
