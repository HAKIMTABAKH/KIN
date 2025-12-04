import { Redirect } from "expo-router";

export default function Index() {
  // TODO: Add authentication check here
  // const isAuthenticated = false;
  
  // if (!isAuthenticated) {
  //   return <Redirect href="/(auth)/sign-in" />;
  // }
  
  return <Redirect href="/tabs/Feed" />;
}
