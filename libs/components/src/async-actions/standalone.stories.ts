import { Component } from "@angular/core";
import { action } from "@storybook/addon-actions";
import { Meta, StoryObj, moduleMetadata } from "@storybook/angular";
import { delay, of } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { ValidationService } from "@bitwarden/common/platform/abstractions/validation.service";

import { ButtonModule } from "../button";
import { IconButtonModule } from "../icon-button";

import { AsyncActionsModule } from "./async-actions.module";
import { BitActionDirective } from "./bit-action.directive";

const template = /*html*/ `
  <button type="button" bitButton buttonType="primary" [bitAction]="action" class="tw-me-2">
    Perform action {{ statusEmoji }}
  </button>
  <button type="button" bitIconButton="bwi-trash" buttonType="danger" [bitAction]="action"></button>`;

@Component({
  template,
  selector: "app-promise-example",
  imports: [AsyncActionsModule, ButtonModule, IconButtonModule],
})
class PromiseExampleComponent {
  statusEmoji = "🟡";
  action = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
        this.statusEmoji = "🟢";
      }, 5000);
    });
  };
}

@Component({
  template,
  selector: "app-action-resolves-quickly",
  imports: [AsyncActionsModule, ButtonModule, IconButtonModule],
})
class ActionResolvesQuicklyComponent {
  statusEmoji = "🟡";

  action = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
        this.statusEmoji = "🟢";
      }, 50);
    });
  };
}

@Component({
  template,
  selector: "app-observable-example",
  imports: [AsyncActionsModule, ButtonModule, IconButtonModule],
})
class ObservableExampleComponent {
  action = () => {
    return of("fake observable").pipe(delay(2000));
  };
}

@Component({
  template,
  selector: "app-rejected-promise-example",
  imports: [AsyncActionsModule, ButtonModule, IconButtonModule],
})
class RejectedPromiseExampleComponent {
  action = async () => {
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => reject(new Error("Simulated error")), 2000);
    });
  };
}

export default {
  title: "Component Library/Async Actions/Standalone",
  decorators: [
    moduleMetadata({
      imports: [
        ButtonModule,
        IconButtonModule,
        BitActionDirective,
        PromiseExampleComponent,
        ObservableExampleComponent,
        RejectedPromiseExampleComponent,
        ActionResolvesQuicklyComponent,
      ],
      providers: [
        {
          provide: ValidationService,
          useValue: {
            showError: action("ValidationService.showError"),
          } as Partial<ValidationService>,
        },
        {
          provide: LogService,
          useValue: {
            error: action("LogService.error"),
          } as Partial<LogService>,
        },
      ],
    }),
  ],
} as Meta;

type PromiseStory = StoryObj<PromiseExampleComponent>;
type ObservableStory = StoryObj<ObservableExampleComponent>;

export const UsingPromise: PromiseStory = {
  render: (args) => ({
    props: args,
    template: `<app-promise-example></app-promise-example>`,
  }),
};

export const UsingObservable: ObservableStory = {
  render: (args) => ({
    template: `<app-observable-example></app-observable-example>`,
  }),
};

export const RejectedPromise: ObservableStory = {
  render: (args) => ({
    template: `<app-rejected-promise-example></app-rejected-promise-example>`,
  }),
};

export const ActionResolvesQuickly: PromiseStory = {
  render: (args) => ({
    props: args,
    template: `<app-action-resolves-quickly></app-action-resolves-quickly>`,
  }),
};
