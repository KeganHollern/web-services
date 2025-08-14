import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=9d7c7c65"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import "/src/styles/globals.css?t=1755137107664";
import __vite__cjsImport2_react from "/node_modules/.vite/deps/react.js?v=9d7c7c65"; const StrictMode = __vite__cjsImport2_react["StrictMode"];
import __vite__cjsImport3_reactDom_client from "/node_modules/.vite/deps/react-dom_client.js?v=b8dde5fb"; const createRoot = __vite__cjsImport3_reactDom_client["createRoot"];
import { BrowserRouter } from "/node_modules/.vite/deps/react-router.js?v=c2fe7431";
import { ThemeProvider } from "/src/context/theme-provider.tsx";
import { DomainRouter } from "/src/pages/domain-router.tsx?t=1755137107664";
import { SidebarProvider } from "/src/components/ui/sidebar.tsx";
import { Toaster } from "/src/components/ui/sonner.tsx";
import Cookies from "/node_modules/.vite/deps/js-cookie.js?v=0c431aec";
import { Sidebar } from "/src/components/page-sidebar.tsx";
import { LinkShareProvider } from "/src/context/linkshare-provider.tsx";
const open = (Cookies.get("sidebar_state") ?? "true") === "true";
createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxDEV(StrictMode, { children: /* @__PURE__ */ jsxDEV(ThemeProvider, { children: /* @__PURE__ */ jsxDEV(LinkShareProvider, { children: [
    /* @__PURE__ */ jsxDEV(SidebarProvider, { defaultOpen: open, children: /* @__PURE__ */ jsxDEV(Sidebar, { children: [
      " ",
      /* @__PURE__ */ jsxDEV(BrowserRouter, { children: /* @__PURE__ */ jsxDEV(DomainRouter, {}, void 0, false, {
        fileName: "/Users/kegan/git/lystic-web/web/src/main.tsx",
        lineNumber: 26,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "/Users/kegan/git/lystic-web/web/src/main.tsx",
        lineNumber: 25,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/Users/kegan/git/lystic-web/web/src/main.tsx",
      lineNumber: 24,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/Users/kegan/git/lystic-web/web/src/main.tsx",
      lineNumber: 23,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV(Toaster, {}, void 0, false, {
      fileName: "/Users/kegan/git/lystic-web/web/src/main.tsx",
      lineNumber: 30,
      columnNumber: 9
    }, this),
    " "
  ] }, void 0, true, {
    fileName: "/Users/kegan/git/lystic-web/web/src/main.tsx",
    lineNumber: 22,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "/Users/kegan/git/lystic-web/web/src/main.tsx",
    lineNumber: 21,
    columnNumber: 5
  }, this) }, void 0, false, {
    fileName: "/Users/kegan/git/lystic-web/web/src/main.tsx",
    lineNumber: 20,
    columnNumber: 3
  }, this)
);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBeUJjO0FBekJkLE9BQU87QUFFUCxTQUFTQSxrQkFBa0I7QUFDM0IsU0FBU0Msa0JBQWtCO0FBRTNCLFNBQVNDLHFCQUFxQjtBQUM5QixTQUFTQyxxQkFBcUI7QUFDOUIsU0FBU0Msb0JBQW9CO0FBQzdCLFNBQVNDLHVCQUF1QjtBQUNoQyxTQUFTQyxlQUFlO0FBR3hCLE9BQU9DLGFBQWE7QUFDcEIsU0FBU0MsZUFBZTtBQUN4QixTQUFTQyx5QkFBeUI7QUFFbEMsTUFBTUMsUUFBUUgsUUFBUUksSUFBSSxlQUFlLEtBQUssWUFBWTtBQUUxRFYsV0FBV1csU0FBU0MsZUFBZSxNQUFNLENBQUUsRUFBRUM7QUFBQUEsRUFDM0MsdUJBQUMsY0FDQyxpQ0FBQyxpQkFDQyxpQ0FBQyxxQkFDQztBQUFBLDJCQUFDLG1CQUFnQixhQUFhSixNQUM1QixpQ0FBQyxXQUFRO0FBQUE7QUFBQSxNQUNQLHVCQUFDLGlCQUNDLGlDQUFDLGtCQUFEO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFBYSxLQURmO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFFQTtBQUFBLFNBSEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUlBLEtBTEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQU1BO0FBQUEsSUFDQSx1QkFBQyxhQUFEO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FBUTtBQUFBLElBQUc7QUFBQSxPQVJiO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FTQSxLQVZGO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FXQSxLQVpGO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FhQTtBQUNGIiwibmFtZXMiOlsiU3RyaWN0TW9kZSIsImNyZWF0ZVJvb3QiLCJCcm93c2VyUm91dGVyIiwiVGhlbWVQcm92aWRlciIsIkRvbWFpblJvdXRlciIsIlNpZGViYXJQcm92aWRlciIsIlRvYXN0ZXIiLCJDb29raWVzIiwiU2lkZWJhciIsIkxpbmtTaGFyZVByb3ZpZGVyIiwib3BlbiIsImdldCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJyZW5kZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsibWFpbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdAL3N0eWxlcy9nbG9iYWxzLmNzcydcblxuaW1wb3J0IHsgU3RyaWN0TW9kZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgY3JlYXRlUm9vdCB9IGZyb20gJ3JlYWN0LWRvbS9jbGllbnQnXG5cbmltcG9ydCB7IEJyb3dzZXJSb3V0ZXIgfSBmcm9tIFwicmVhY3Qtcm91dGVyXCI7XG5pbXBvcnQgeyBUaGVtZVByb3ZpZGVyIH0gZnJvbSBcIkAvY29udGV4dC90aGVtZS1wcm92aWRlclwiXG5pbXBvcnQgeyBEb21haW5Sb3V0ZXIgfSBmcm9tIFwiQC9wYWdlcy9kb21haW4tcm91dGVyXCJcbmltcG9ydCB7IFNpZGViYXJQcm92aWRlciB9IGZyb20gJ0AvY29tcG9uZW50cy91aS9zaWRlYmFyJztcbmltcG9ydCB7IFRvYXN0ZXIgfSBmcm9tIFwiQC9jb21wb25lbnRzL3VpL3Nvbm5lclwiXG5cblxuaW1wb3J0IENvb2tpZXMgZnJvbSAnanMtY29va2llJztcbmltcG9ydCB7IFNpZGViYXIgfSBmcm9tIFwiQC9jb21wb25lbnRzL3BhZ2Utc2lkZWJhclwiXG5pbXBvcnQgeyBMaW5rU2hhcmVQcm92aWRlciB9IGZyb20gJ0AvY29udGV4dC9saW5rc2hhcmUtcHJvdmlkZXInO1xuXG5jb25zdCBvcGVuID0gKENvb2tpZXMuZ2V0KCdzaWRlYmFyX3N0YXRlJykgPz8gXCJ0cnVlXCIpID09PSBcInRydWVcIjtcblxuY3JlYXRlUm9vdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9vdCcpISkucmVuZGVyKFxuICA8U3RyaWN0TW9kZT5cbiAgICA8VGhlbWVQcm92aWRlcj5cbiAgICAgIDxMaW5rU2hhcmVQcm92aWRlcj5cbiAgICAgICAgPFNpZGViYXJQcm92aWRlciBkZWZhdWx0T3Blbj17b3Blbn0+XG4gICAgICAgICAgPFNpZGViYXI+IHsvKiBnbG9iYWwgc2lkZWJhciBmb3IgYWxsIG15IHdlYnNpdGUgKi99XG4gICAgICAgICAgICA8QnJvd3NlclJvdXRlcj5cbiAgICAgICAgICAgICAgPERvbWFpblJvdXRlciAvPlxuICAgICAgICAgICAgPC9Ccm93c2VyUm91dGVyPlxuICAgICAgICAgIDwvU2lkZWJhcj5cbiAgICAgICAgPC9TaWRlYmFyUHJvdmlkZXI+XG4gICAgICAgIDxUb2FzdGVyIC8+IHsvKiBmb3IgZ2xvYmFsIHRvYXN0IG5vdGlmaWNhdGlvbnMgKi99XG4gICAgICA8L0xpbmtTaGFyZVByb3ZpZGVyPlxuICAgIDwvVGhlbWVQcm92aWRlcj5cbiAgPC9TdHJpY3RNb2RlPixcbilcbiJdLCJmaWxlIjoiL1VzZXJzL2tlZ2FuL2dpdC9seXN0aWMtd2ViL3dlYi9zcmMvbWFpbi50c3gifQ==