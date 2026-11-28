export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <section className="section">
      <div className="container narrow" style={{ textAlign: 'center' }}>
        <h1 className="page-title">You are offline</h1>
        <p className="muted">Please check your internet connection and try again.</p>
      </div>
    </section>
  );
}
