import { mock, MockProxy } from "jest-mock-extended";

import AutofillInit from "../../../content/autofill-init";
import { DomQueryService } from "../../../services/abstractions/dom-query.service";
import DomElementVisibilityService from "../../../services/dom-element-visibility.service";
import { flushPromises, sendMockExtensionMessage } from "../../../spec/testing-utils";
import * as utils from "../../../utils";
import { sendExtensionMessage } from "../../../utils";
import { NotificationTypeData } from "../abstractions/overlay-notifications-content.service";

import { OverlayNotificationsContentService } from "./overlay-notifications-content.service";

describe("OverlayNotificationsContentService", () => {
  let overlayNotificationsContentService: OverlayNotificationsContentService;
  let domQueryService: MockProxy<DomQueryService>;
  let domElementVisibilityService: DomElementVisibilityService;
  let autofillInit: AutofillInit;
  let bodyAppendChildSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(utils, "sendExtensionMessage")
      .mockImplementation((command: string) =>
        Promise.resolve(command === "notificationRefreshFlagValue" ? false : true),
      );
    domQueryService = mock<DomQueryService>();
    domElementVisibilityService = new DomElementVisibilityService();
    overlayNotificationsContentService = new OverlayNotificationsContentService();
    autofillInit = new AutofillInit(
      domQueryService,
      domElementVisibilityService,
      undefined,
      undefined,
      overlayNotificationsContentService,
    );
    autofillInit.init();
    bodyAppendChildSpy = jest.spyOn(globalThis.document.body, "appendChild");
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("opening the notification bar", () => {
    it("skips opening the notification bar if the init data is not present in the message", async () => {
      sendMockExtensionMessage({ command: "openNotificationBar" });
      await flushPromises();

      expect(bodyAppendChildSpy).not.toHaveBeenCalled();
    });

    it("applies correct styles when notificationRefreshFlag is true", async () => {
      (sendExtensionMessage as jest.Mock).mockResolvedValue(true);
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();

      const barElement = overlayNotificationsContentService["notificationBarElement"]!;
      expect(barElement.style.height).toBe("400px");
      expect(barElement.style.right).toBe("0px");
    });

    it("applies correct styles when notificationRefreshFlag is false", async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();

      const barElement = overlayNotificationsContentService["notificationBarElement"]!;
      expect(barElement.style.height).toBe("82px");
      expect(barElement.style.right).toBe("10px");
    });

    it("closes the notification bar if the notification bar type has changed", async () => {
      overlayNotificationsContentService["currentNotificationBarType"] = "add";
      const closeNotificationBarSpy = jest.spyOn(
        overlayNotificationsContentService as any,
        "closeNotificationBar",
      );

      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();

      expect(closeNotificationBarSpy).toHaveBeenCalled();
    });

    it("creates the notification bar elements and appends them to the body", async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();

      expect(overlayNotificationsContentService["notificationBarElement"]).toMatchSnapshot();
    });

    it("sets up a slide in animation when the notification is fresh", async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>({
            launchTimestamp: Date.now(),
          }),
        },
      });
      await flushPromises();

      expect(
        overlayNotificationsContentService["notificationBarIframeElement"]?.style.transform,
      ).toBe("translateX(100%)");
    });

    it("triggers the iframe animation on load of the element", async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();

      overlayNotificationsContentService["notificationBarIframeElement"]?.dispatchEvent(
        new Event("load"),
      );

      expect(
        overlayNotificationsContentService["notificationBarIframeElement"]?.style.transform,
      ).toBe("translateX(0)");
    });

    it("sends an initialization message to the notification bar iframe", async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();
      const postMessageSpy = jest.spyOn(
        overlayNotificationsContentService["notificationBarIframeElement"].contentWindow,
        "postMessage",
      );

      globalThis.dispatchEvent(
        new MessageEvent("message", {
          data: { command: "someOtherMessage" },
        }),
      );
      globalThis.dispatchEvent(
        new MessageEvent("message", {
          data: { command: "initNotificationBar" },
          source: overlayNotificationsContentService["notificationBarIframeElement"]?.contentWindow,
        }),
      );
      await flushPromises();

      expect(postMessageSpy).toHaveBeenCalledTimes(1);
      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          command: "initNotificationBar",
          initData: expect.any(Object),
        },
        "*",
      );
    });
  });

  describe("closing the notification bar", () => {
    beforeEach(async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();
    });

    it("triggers a fadeout of the notification bar", () => {
      sendMockExtensionMessage({
        command: "closeNotificationBar",
        data: { fadeOutNotification: true },
      });

      expect(
        overlayNotificationsContentService["notificationBarIframeElement"]?.style.opacity,
      ).toBe("0");

      jest.advanceTimersByTime(150);

      expect(sendExtensionMessage).toHaveBeenCalledWith("bgRemoveTabFromNotificationQueue");
    });

    it("closes the notification bar without a fadeout", () => {
      jest.spyOn(globalThis, "setTimeout");
      sendMockExtensionMessage({
        command: "closeNotificationBar",
        data: { fadeOutNotification: false },
      });

      expect(globalThis.setTimeout).not.toHaveBeenCalled();
      expect(overlayNotificationsContentService["notificationBarIframeElement"]).toBeNull();
    });
  });

  describe("adjusting the notification bar's height", () => {
    beforeEach(async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();
    });

    it("adjusts the height of the notification bar", () => {
      sendMockExtensionMessage({
        command: "adjustNotificationBar",
        data: { height: 1000 },
      });

      expect(overlayNotificationsContentService["notificationBarElement"]?.style.height).toBe(
        "1000px",
      );
    });
  });

  describe("when a save cipher attempt is completed", () => {
    beforeEach(async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();
    });

    it("sends a message to the notification bar iframe indicating that the save attempt completed", () => {
      jest.spyOn(
        overlayNotificationsContentService["notificationBarIframeElement"].contentWindow,
        "postMessage",
      );

      sendMockExtensionMessage({
        command: "saveCipherAttemptCompleted",
        data: { error: undefined },
      });

      expect(
        overlayNotificationsContentService["notificationBarIframeElement"].contentWindow
          .postMessage,
      ).toHaveBeenCalledWith({ command: "saveCipherAttemptCompleted", error: undefined }, "*");
    });
  });

  describe("destroy", () => {
    beforeEach(async () => {
      sendMockExtensionMessage({
        command: "openNotificationBar",
        data: {
          type: "change",
          typeData: mock<NotificationTypeData>(),
        },
      });
      await flushPromises();
    });

    it("triggers a closure of the notification bar", () => {
      overlayNotificationsContentService.destroy();

      expect(overlayNotificationsContentService["notificationBarElement"]).toBeNull();
      expect(overlayNotificationsContentService["notificationBarIframeElement"]).toBeNull();
    });
  });
});
