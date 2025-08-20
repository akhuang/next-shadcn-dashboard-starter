#!/bin/bash

# 将用户设置为超级管理员的脚本

EMAIL="${1:-admin@example.com}"

echo "Making $EMAIL a super admin..."

docker exec plausible-analytics sh -c "cd /app && bin/plausible eval '
  alias Plausible.{Auth, Repo}
  
  case Repo.get_by(Auth.User, email: \"$EMAIL\") do
    nil ->
      IO.puts(\"User not found with email: $EMAIL\")
    user ->
      user
      |> Ecto.Changeset.change(%{
        email_verified: true,
        is_admin: true,
        is_super_admin: true
      })
      |> Repo.update!()
      IO.puts(\"User $EMAIL is now a super admin!\")
      IO.puts(\"Email verified: true\")
      IO.puts(\"Admin: true\")
      IO.puts(\"Super Admin: true\")
  end
'"

echo "Done! User $EMAIL should now have full admin access."