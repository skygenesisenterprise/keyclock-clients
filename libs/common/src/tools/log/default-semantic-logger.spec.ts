import { mock } from "jest-mock-extended";

import { LogService } from "../../platform/abstractions/log.service";
import { LogLevelType } from "../../platform/enums";

import { DefaultSemanticLogger } from "./default-semantic-logger";

const logger = mock<LogService>();

describe("DefaultSemanticLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("debug", () => {
    it("writes structural log messages to console.log", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.debug("this is a debug message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Debug, {
        "@timestamp": 0,
        message: "this is a debug message",
        level: "debug",
      });
    });

    it("writes structural content to console.log", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.debug({ example: "this is content" });

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Debug, {
        "@timestamp": 0,
        content: { example: "this is content" },
        level: "debug",
      });
    });

    it("writes structural content to console.log with a message", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.info({ example: "this is content" }, "this is a message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Info, {
        "@timestamp": 0,
        content: { example: "this is content" },
        message: "this is a message",
        level: "information",
      });
    });
  });

  describe("info", () => {
    it("writes structural log messages to console.log", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.info("this is an info message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Info, {
        "@timestamp": 0,
        message: "this is an info message",
        level: "information",
      });
    });

    it("writes structural content to console.log", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.info({ example: "this is content" });

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Info, {
        "@timestamp": 0,
        content: { example: "this is content" },
        level: "information",
      });
    });

    it("writes structural content to console.log with a message", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.info({ example: "this is content" }, "this is a message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Info, {
        "@timestamp": 0,
        content: { example: "this is content" },
        message: "this is a message",
        level: "information",
      });
    });
  });

  describe("warn", () => {
    it("writes structural log messages to console.warn", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.warn("this is a warning message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Warning, {
        "@timestamp": 0,
        message: "this is a warning message",
        level: "warning",
      });
    });

    it("writes structural content to console.warn", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.warn({ example: "this is content" });

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Warning, {
        "@timestamp": 0,
        content: { example: "this is content" },
        level: "warning",
      });
    });

    it("writes structural content to console.warn with a message", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.warn({ example: "this is content" }, "this is a message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Warning, {
        "@timestamp": 0,
        content: { example: "this is content" },
        message: "this is a message",
        level: "warning",
      });
    });
  });

  describe("error", () => {
    it("writes structural log messages to console.error", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.error("this is an error message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Error, {
        "@timestamp": 0,
        message: "this is an error message",
        level: "error",
      });
    });

    it("writes structural content to console.error", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.error({ example: "this is content" });

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Error, {
        "@timestamp": 0,
        content: { example: "this is content" },
        level: "error",
      });
    });

    it("writes structural content to console.error with a message", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      log.error({ example: "this is content" }, "this is a message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Error, {
        "@timestamp": 0,
        content: { example: "this is content" },
        message: "this is a message",
        level: "error",
      });
    });
  });

  describe("panic", () => {
    it("writes structural log messages to console.error before throwing the message", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      expect(() => log.panic("this is an error message")).toThrow("this is an error message");

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Error, {
        "@timestamp": 0,
        message: "this is an error message",
        level: "error",
      });
    });

    it("writes structural log messages to console.error with a message before throwing the message", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      expect(() => log.panic({ example: "this is content" }, "this is an error message")).toThrow(
        "this is an error message",
      );

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Error, {
        "@timestamp": 0,
        content: { example: "this is content" },
        message: "this is an error message",
        level: "error",
      });
    });

    it("writes structural log messages to console.error with a content before throwing the message", () => {
      const log = new DefaultSemanticLogger(logger, {}, () => 0);

      expect(() => log.panic("this is content", "this is an error message")).toThrow(
        "this is an error message",
      );

      expect(logger.write).toHaveBeenCalledWith(LogLevelType.Error, {
        "@timestamp": 0,
        content: "this is content",
        message: "this is an error message",
        level: "error",
      });
    });
  });
});
