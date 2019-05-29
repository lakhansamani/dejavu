workflow "Push" {
  on = "push"
  resolves = ["Draft Release"]
}

action "Draft Release" {
  uses = "toolmantim/release-drafter@v5.1.1"
  secrets = ["2ab41c4cecd92cc414afabc9e146cab2c071988c"]
}
