import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function SignInSuccessPage() {
  const storedReturn = sessionStorage.getItem("redirect");

  const navigation = useNavigate();
  useEffect(() => {
    navigation(storedReturn || "/");
  }, [navigation, storedReturn]);

  return (
    <BasicLayout>
      <h1>Redirecting...</h1>
    </BasicLayout>
  );
}
