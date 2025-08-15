// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
/**
 * Represents an HTML form whose elements can be autofilled
 */
export default class AutofillForm {
  [key: string]: any;
  /**
   * The unique identifier assigned to this field during collection of the page details
   */
  opid: string;
  /**
   * The HTML `name` attribute of the form field
   */
  htmlName: string;
  /**
   * The HTML `id` attribute of the form field
   */
  htmlID: string;
  /**
   * The HTML `action` attribute of the form field
   */
  htmlAction: string;
  /**
   * The HTML `method` attribute of the form field
   */
  htmlMethod: string;
}
