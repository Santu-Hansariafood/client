import axios from "axios";

const { API_KEY, TEST_ADMIN_MOBILE, TEST_ADMIN_PASSWORD } = process.env;
const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:5000";

if (!API_KEY || !TEST_ADMIN_MOBILE || !TEST_ADMIN_PASSWORD) {
  throw new Error(
    "Set API_KEY, TEST_ADMIN_MOBILE, and TEST_ADMIN_PASSWORD before running this test.",
  );
}

try {
  await axios.post(
    `${apiBaseUrl}/api/admin/login`,
    {
      mobile: TEST_ADMIN_MOBILE,
      password: TEST_ADMIN_PASSWORD,
    },
    {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
  console.log("Login test succeeded.");
} catch (error) {
  console.error("Login test failed with status:", error.response?.status || "network error");
  process.exitCode = 1;
}
