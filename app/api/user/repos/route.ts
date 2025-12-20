import { NextResponse } from "next/server"
import { Octokit } from "octokit"
import { getServerSession } from "next-auth"
// This import will now work because authOptions is exported above
import { authOptions } from "../../auth/[...nextauth]/route" 

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  // @ts-ignore
  const token = session?.accessToken

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const octokit = new Octokit({ auth: token })

    const { data } = await octokit.request("GET /user/repos", {
      sort: "updated",
      per_page: 50,
      visibility: "all",
    })

    const repos = data.map((repo) => ({
      id: repo.id,
      name: repo.full_name,
      private: repo.private,
      url: repo.html_url,
    }))

    return NextResponse.json({ repos })
  } catch (error: any) {
    console.error("Repo Fetch Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}