#!/usr/bin/env node

import { startCoachServer } from "./coachServer.js";

startCoachServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
