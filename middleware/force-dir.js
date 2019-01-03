export default function({ route, redirect }) {
  if (!route.path.endsWith('/')) {
    redirect(route.path + '/');
  }
}
