import { NextResponse } from "next/server"
import { Octokit } from "octokit"

export async function GET(request: Request) {
  // 1. Get the user's token from the request headers
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 2. Connect to GitHub as the User
    const octokit = new Octokit({ auth: token })

    // 3. Fetch their repositories (sorted by recently updated)
    // We fetch 50 to give them a good selection
    const { data } = await octokit.request("GET /user/repos", {
      sort: "updated",
      per_page: 50,
      visibility: "all", // Public AND Private
    })

    // 4. Return just the data we need
    const repos = data.map((repo) => ({
      id: repo.id,
      name: repo.full_name, // e.g., "yash/onboard-ai"
      private: repo.private,
      url: repo.html_url,
    }))

    return NextResponse.json({ repos })
  } catch (error: any) {
    console.error("Repo Fetch Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}