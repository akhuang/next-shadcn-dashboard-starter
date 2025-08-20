#!/bin/bash

# 创建 Plausible 管理员用户的脚本

echo "Creating Plausible admin user..."

docker exec plausible-analytics sh -c "cd /app && bin/plausible eval '
  alias Plausible.{Auth, Repo}
  
  user_params = %{
    email: \"admin@example.com\",
    name: \"Admin\",
    password: \"changeme123\",
    password_confirmation: \"changeme123\"
  }
  
  case Auth.User.new(user_params) |> Repo.insert() do
    {:ok, user} ->
      IO.puts(\"Admin user created successfully!\")
      IO.puts(\"Email: #{user.email}\")
    {:error, changeset} ->
      if Repo.get_by(Auth.User, email: \"admin@example.com\") do
        IO.puts(\"User already exists with email: admin@example.com\")
      else
        IO.puts(\"Error creating user:\")
        IO.inspect(changeset.errors)
      end
  end
'"

echo "Done! You can now login at http://localhost:8000"