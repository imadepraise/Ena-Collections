// Pages with their own big bottom button (or a sign-in form) hide the bottom tab bar on phones.
export function isFocusPage(path: string) {
  return (
    path === '/cart' ||
    path === '/checkout' ||
    path.startsWith('/shop/') ||
    path === '/login' ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    path.startsWith('/auth')
  );
}
