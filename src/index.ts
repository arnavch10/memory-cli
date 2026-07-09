#!/usr/bin/env bun
import { Command } from "commander";
import { initCommand } from "./commands/init"
import { runCommand } from "./commands/run"
const program = new Command();

program
    .name("memory")
    .description("Unified memory for coding agents that sits between you and the repo.")
    .version("0.1");

program.command("init")
    .description("Initalize project folder .memory/")
    .action(initCommand);

program.command("run")
    .description("Run project")
    .action(runCommand);

program.parseAsync();