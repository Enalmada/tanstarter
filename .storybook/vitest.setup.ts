import { setProjectAnnotations } from "@storybook/react";
import { beforeAll } from "vitest";
import "../src/polyfills/process";
import * as projectAnnotations from "./preview";

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/writing-tests/vitest-addon#set-up-your-vitest-config
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
