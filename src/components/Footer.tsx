export const Footer = () => {
  return (
    <footer className="text-center p-2 text-xs text-muted-foreground border-t mt-auto">
      Found an issue?{' '}
      <a
        href="https://github.com/raphalupi/ptcgp-tracker-tools/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground transition-colors"
      >
        Report a bug
      </a>
    </footer>
  );
}; 