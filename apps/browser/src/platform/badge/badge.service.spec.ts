import { mock, MockProxy } from "jest-mock-extended";
import { Subscription } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { FakeAccountService, FakeStateProvider } from "@bitwarden/common/spec";

import { RawBadgeState } from "./badge-browser-api";
import { BadgeService } from "./badge.service";
import { DefaultBadgeState } from "./consts";
import { BadgeIcon } from "./icon";
import { BadgeStatePriority } from "./priority";
import { BadgeState, Unset } from "./state";
import { MockBadgeBrowserApi } from "./test/mock-badge-browser-api";

describe("BadgeService", () => {
  let badgeApi: MockBadgeBrowserApi;
  let stateProvider: FakeStateProvider;
  let logService!: MockProxy<LogService>;
  let badgeService!: BadgeService;

  let badgeServiceSubscription: Subscription;

  beforeEach(() => {
    badgeApi = new MockBadgeBrowserApi();
    stateProvider = new FakeStateProvider(new FakeAccountService({}));
    logService = mock<LogService>();

    badgeService = new BadgeService(stateProvider, badgeApi, logService);
  });

  afterEach(() => {
    badgeServiceSubscription?.unsubscribe();
  });

  describe("calling without tabId", () => {
    const tabId = 1;

    describe("given a single tab is open", () => {
      beforeEach(() => {
        badgeApi.tabs = [1];
        badgeApi.setActiveTab(tabId);
        badgeServiceSubscription = badgeService.startListening();
      });

      it("sets provided state when no other state has been set", async () => {
        const state: BadgeState = {
          text: "text",
          backgroundColor: "color",
          icon: BadgeIcon.Locked,
        };

        await badgeService.setState("state-name", BadgeStatePriority.Default, state);

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual(state);
      });

      it("sets default values when none are provided", async () => {
        // This is a bit of a weird thing to do, but I don't think it's something we need to prohibit
        const state: BadgeState = {};

        await badgeService.setState("state-name", BadgeStatePriority.Default, state);

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual(DefaultBadgeState);
      });

      it("merges states when multiple same-priority states have been set", async () => {
        await badgeService.setState("state-1", BadgeStatePriority.Default, { text: "text" });
        await badgeService.setState("state-2", BadgeStatePriority.Default, {
          backgroundColor: "#fff",
        });
        await badgeService.setState("state-3", BadgeStatePriority.Default, {
          icon: BadgeIcon.Locked,
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        const expectedState: RawBadgeState = {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        };
        expect(badgeApi.specificStates[tabId]).toEqual(expectedState);
      });

      it("overrides previous lower-priority state when higher-priority state is set", async () => {
        await badgeService.setState("state-1", BadgeStatePriority.Low, {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        });
        await badgeService.setState("state-2", BadgeStatePriority.Default, {
          text: "override",
        });
        await badgeService.setState("state-3", BadgeStatePriority.High, {
          backgroundColor: "#aaa",
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        const expectedState: RawBadgeState = {
          text: "override",
          backgroundColor: "#aaa",
          icon: BadgeIcon.Locked,
        };
        expect(badgeApi.specificStates[tabId]).toEqual(expectedState);
      });

      it("removes override when a previously high-priority state is cleared", async () => {
        await badgeService.setState("state-1", BadgeStatePriority.Low, {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        });
        await badgeService.setState("state-2", BadgeStatePriority.Default, {
          text: "override",
        });
        await badgeService.clearState("state-2");

        await new Promise((resolve) => setTimeout(resolve, 0));
        const expectedState: RawBadgeState = {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        };
        expect(badgeApi.specificStates[tabId]).toEqual(expectedState);
      });

      it("sets default values when all states have been cleared", async () => {
        await badgeService.setState("state-1", BadgeStatePriority.Low, {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        });
        await badgeService.setState("state-2", BadgeStatePriority.Default, {
          text: "override",
        });
        await badgeService.setState("state-3", BadgeStatePriority.High, {
          backgroundColor: "#aaa",
        });
        await badgeService.clearState("state-1");
        await badgeService.clearState("state-2");
        await badgeService.clearState("state-3");

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual(DefaultBadgeState);
      });

      it("sets default value high-priority state contains Unset", async () => {
        await badgeService.setState("state-1", BadgeStatePriority.Low, {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        });
        await badgeService.setState("state-3", BadgeStatePriority.High, {
          icon: Unset,
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        const expectedState: RawBadgeState = {
          text: "text",
          backgroundColor: "#fff",
          icon: DefaultBadgeState.icon,
        };
        expect(badgeApi.specificStates[tabId]).toEqual(expectedState);
      });

      it("ignores medium-priority Unset when high-priority contains a value", async () => {
        await badgeService.setState("state-1", BadgeStatePriority.Low, {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        });
        await badgeService.setState("state-3", BadgeStatePriority.Default, {
          icon: Unset,
        });
        await badgeService.setState("state-3", BadgeStatePriority.High, {
          icon: BadgeIcon.Unlocked,
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        const expectedState: RawBadgeState = {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Unlocked,
        };
        expect(badgeApi.specificStates[tabId]).toEqual(expectedState);
      });
    });

    describe("given multiple tabs are open", () => {
      const tabId = 1;
      const tabIds = [1, 2, 3];

      beforeEach(() => {
        badgeApi.tabs = tabIds;
        badgeApi.setActiveTab(tabId);
        badgeServiceSubscription = badgeService.startListening();
      });

      it("sets state for each tab when no other state has been set", async () => {
        const state: BadgeState = {
          text: "text",
          backgroundColor: "color",
          icon: BadgeIcon.Locked,
        };

        await badgeService.setState("state-name", BadgeStatePriority.Default, state);

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates).toEqual({
          1: state,
          2: undefined,
          3: undefined,
        });
      });
    });
  });

  describe("calling with tabId", () => {
    describe("given a single tab is open", () => {
      const tabId = 1;

      beforeEach(() => {
        badgeApi.tabs = [tabId];
        badgeApi.setActiveTab(tabId);
        badgeServiceSubscription = badgeService.startListening();
      });

      it("sets provided state when no other state has been set", async () => {
        const state: BadgeState = {
          text: "text",
          backgroundColor: "color",
          icon: BadgeIcon.Locked,
        };

        await badgeService.setState("state-name", BadgeStatePriority.Default, state, tabId);

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual(state);
      });

      it("sets default values when none are provided", async () => {
        // This is a bit of a weird thing to do, but I don't think it's something we need to prohibit
        const state: BadgeState = {};

        await badgeService.setState("state-name", BadgeStatePriority.Default, state, tabId);

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual(DefaultBadgeState);
      });

      it("merges tabId specific state with general states", async () => {
        await badgeService.setState("general-state", BadgeStatePriority.Default, { text: "text" });
        await badgeService.setState(
          "specific-state",
          BadgeStatePriority.Default,
          {
            backgroundColor: "#fff",
          },
          tabId,
        );
        await badgeService.setState("general-state-2", BadgeStatePriority.Default, {
          icon: BadgeIcon.Locked,
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual({
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        });
      });

      it("merges states when multiple same-priority states with the same tabId have been set", async () => {
        await badgeService.setState("state-1", BadgeStatePriority.Default, { text: "text" }, tabId);
        await badgeService.setState(
          "state-2",
          BadgeStatePriority.Default,
          {
            backgroundColor: "#fff",
          },
          tabId,
        );
        await badgeService.setState(
          "state-3",
          BadgeStatePriority.Default,
          {
            icon: BadgeIcon.Locked,
          },
          tabId,
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
        const expectedState: RawBadgeState = {
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        };
        expect(badgeApi.specificStates[tabId]).toEqual(expectedState);
      });

      it("overrides previous lower-priority state when higher-priority state with the same tabId is set", async () => {
        await badgeService.setState(
          "state-1",
          BadgeStatePriority.Low,
          {
            text: "text",
            backgroundColor: "#fff",
            icon: BadgeIcon.Locked,
          },
          tabId,
        );
        await badgeService.setState(
          "state-2",
          BadgeStatePriority.Default,
          {
            text: "override",
          },
          tabId,
        );
        await badgeService.setState(
          "state-3",
          BadgeStatePriority.High,
          {
            backgroundColor: "#aaa",
          },
          tabId,
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
        const expectedState: RawBadgeState = {
          text: "override",
          backgroundColor: "#aaa",
          icon: BadgeIcon.Locked,
        };
        expect(badgeApi.specificStates[tabId]).toEqual(expectedState);
      });

      it("overrides lower-priority tab-specific state when higher-priority general state is set", async () => {
        await badgeService.setState(
          "state-1",
          BadgeStatePriority.Low,
          {
            text: "text",
            backgroundColor: "#fff",
            icon: BadgeIcon.Locked,
          },
          tabId,
        );
        await badgeService.setState("state-2", BadgeStatePriority.Default, {
          text: "override",
        });
        await badgeService.setState("state-3", BadgeStatePriority.High, {
          backgroundColor: "#aaa",
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual({
          text: "override",
          backgroundColor: "#aaa",
          icon: BadgeIcon.Locked,
        });
      });

      it("removes override when a previously high-priority state with the same tabId is cleared", async () => {
        await badgeService.setState(
          "state-1",
          BadgeStatePriority.Low,
          {
            text: "text",
            backgroundColor: "#fff",
            icon: BadgeIcon.Locked,
          },
          tabId,
        );
        await badgeService.setState(
          "state-2",
          BadgeStatePriority.Default,
          {
            text: "override",
          },
          tabId,
        );
        await badgeService.clearState("state-2");

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual({
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Locked,
        });
      });

      it("sets default state when all states with the same tabId have been cleared", async () => {
        await badgeService.setState(
          "state-1",
          BadgeStatePriority.Low,
          {
            text: "text",
            backgroundColor: "#fff",
            icon: BadgeIcon.Locked,
          },
          tabId,
        );
        await badgeService.setState(
          "state-2",
          BadgeStatePriority.Default,
          {
            text: "override",
          },
          tabId,
        );
        await badgeService.setState(
          "state-3",
          BadgeStatePriority.High,
          {
            backgroundColor: "#aaa",
          },
          tabId,
        );
        await badgeService.clearState("state-1");
        await badgeService.clearState("state-2");
        await badgeService.clearState("state-3");

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual(DefaultBadgeState);
      });

      it("sets default value when high-priority state contains Unset", async () => {
        await badgeService.setState(
          "state-1",
          BadgeStatePriority.Low,
          {
            text: "text",
            backgroundColor: "#fff",
            icon: BadgeIcon.Locked,
          },
          tabId,
        );
        await badgeService.setState(
          "state-3",
          BadgeStatePriority.High,
          {
            icon: Unset,
          },
          tabId,
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual({
          text: "text",
          backgroundColor: "#fff",
          icon: DefaultBadgeState.icon,
        });
      });

      it("ignores medium-priority Unset when high-priority contains a value", async () => {
        await badgeService.setState(
          "state-1",
          BadgeStatePriority.Low,
          {
            text: "text",
            backgroundColor: "#fff",
            icon: BadgeIcon.Locked,
          },
          tabId,
        );
        await badgeService.setState(
          "state-3",
          BadgeStatePriority.Default,
          {
            icon: Unset,
          },
          tabId,
        );
        await badgeService.setState(
          "state-3",
          BadgeStatePriority.High,
          {
            icon: BadgeIcon.Unlocked,
          },
          tabId,
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates[tabId]).toEqual({
          text: "text",
          backgroundColor: "#fff",
          icon: BadgeIcon.Unlocked,
        });
      });
    });

    describe("given multiple tabs are open", () => {
      const tabId = 1;
      const tabIds = [1, 2, 3];

      beforeEach(() => {
        badgeApi.tabs = tabIds;
        badgeApi.setActiveTab(tabId);
        badgeServiceSubscription = badgeService.startListening();
      });

      it("sets tab-specific state for provided tab", async () => {
        const generalState: BadgeState = {
          text: "general-text",
          backgroundColor: "general-color",
          icon: BadgeIcon.Unlocked,
        };
        const specificState: BadgeState = {
          text: "tab-text",
          icon: BadgeIcon.Locked,
        };

        await badgeService.setState("general-state", BadgeStatePriority.Default, generalState);
        await badgeService.setState(
          "tab-state",
          BadgeStatePriority.Default,
          specificState,
          tabIds[0],
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(badgeApi.specificStates).toEqual({
          [tabIds[0]]: { ...specificState, backgroundColor: "general-color" },
          [tabIds[1]]: undefined,
          [tabIds[2]]: undefined,
        });
      });
    });
  });
});
