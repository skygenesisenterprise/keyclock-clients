import { Component, DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { ButtonModule } from "./index";

describe("Button", () => {
  let fixture: ComponentFixture<TestApp>;
  let testAppComponent: TestApp;
  let buttonDebugElement: DebugElement;
  let disabledButtonDebugElement: DebugElement;
  let linkDebugElement: DebugElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TestApp],
    });

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(TestApp);
    testAppComponent = fixture.debugElement.componentInstance;
    buttonDebugElement = fixture.debugElement.query(By.css("button"));
    disabledButtonDebugElement = fixture.debugElement.query(By.css("button#disabled"));
    linkDebugElement = fixture.debugElement.query(By.css("a"));
  });

  it("should not be disabled when loading and disabled are false", () => {
    testAppComponent.loading = false;
    testAppComponent.disabled = false;
    fixture.detectChanges();

    expect(buttonDebugElement.attributes["loading"]).toBeFalsy();
    expect(linkDebugElement.attributes["loading"]).toBeFalsy();
    expect(buttonDebugElement.nativeElement.disabled).toBeFalsy();
  });

  it("should be disabled when disabled is true", () => {
    testAppComponent.disabled = true;
    fixture.detectChanges();

    expect(buttonDebugElement.nativeElement.disabled).toBeTruthy();
    // Anchor tags cannot be disabled.
  });

  it("should be disabled when attribute disabled is true", () => {
    expect(disabledButtonDebugElement.nativeElement.disabled).toBeTruthy();
  });

  it("should be disabled when loading is true", () => {
    testAppComponent.loading = true;
    fixture.detectChanges();

    expect(buttonDebugElement.nativeElement.disabled).toBeTruthy();
  });
});

@Component({
  selector: "test-app",
  template: `
    <button
      type="button"
      bitButton
      [buttonType]="buttonType"
      [block]="block"
      [disabled]="disabled"
      [loading]="loading"
    >
      Button
    </button>
    <a
      href="#"
      bitButton
      [buttonType]="buttonType"
      [block]="block"
      [disabled]="disabled"
      [loading]="loading"
    >
      Link
    </a>

    <button id="disabled" type="button" bitButton disabled>Button</button>
  `,
  imports: [ButtonModule],
})
class TestApp {
  buttonType?: string;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
}
