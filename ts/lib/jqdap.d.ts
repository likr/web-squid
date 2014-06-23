/// <reference path="../typings/jquery/jquery.d.ts"/>

declare module jqdap {
interface AjaxOptions {
  username: string;
  password: string;
  withCredentials: boolean;
}

function loadData(url: string, options?: AjaxOptions): JQueryXHR;

function loadDataset(url: string, options?: AjaxOptions): JQueryXHR;
}
