#!/bin/bash

# 验证 Plausible 用户邮箱的脚本

EMAIL="${1:-admin@example.com}"

echo "Verifying email for: $EMAIL"

docker exec plausible-analytics sh -c "cd /app && bin/plausible eval '
  alias Plausible.{Auth, Repo}
  
  case Repo.get_by(Auth.User, email: \"$EMAIL\") do
    nil ->
      IO.puts(\"User not found with email: $EMAIL\")
    user ->
      user
      |> Ecto.Changeset.change(email_verified: true)
      |> Repo.update!()
      IO.puts(\"Email verified successfully for: $EMAIL\")
  end
'"

echo "Done!"