/**
 * @jest-environment jsdom
 */

 import { screen, waitFor, fireEvent } from "@testing-library/dom";
 import BillsUI from "../views/BillsUI.js";
 import { bills } from "../fixtures/bills.js";
 import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
 import { localStorageMock } from "../__mocks__/localStorage.js";
 import Bills from "../containers/Bills.js";
 import router from "../app/Router.js";
 import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // 

  describe("When I am on Bills Page and I click on the icon eye", () => {
    test("Then it should open the modal", () => {

      // on affiche la page Bill avec les datas des notes de frais
      const html = BillsUI({
        data: bills,
      });
      document.body.innerHTML = html;

      // on init onNavigate
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // on instancie la class Bills
      const billsList = new Bills({
        document,
        onNavigate,
        store :null,
        localStorage: window.localStorage,
      });

      // on simule la création d'une modale 
      $.fn.modal = jest.fn();

      //on simule la méthode handleClickIconEye 
      const icon = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() => billsList.handleClickIconEye(icon));
      icon.addEventListener("click", handleClickIconEye);
      
      // on simule l'évènement du clic avec fireEvent
      fireEvent.click(icon);

      // on vérifie que la fonction handleClickIconEye est bien appelée
      expect(handleClickIconEye).toHaveBeenCalled();
      // on vérifie que la modale s'ouvre bien
      const modale = document.getElementById("modaleFile");
      expect(modale).toBeTruthy();
    });
  });

  describe("When I click on 'Nouvelle note de frais'", () => {
    test("Then I should be sent to the page 'New bill page'", () => {
      
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      const store = null;
      const billsList = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const newBill = jest.fn(() => billsList.handleClickNewBill);
      const navigationButton = screen.getByTestId("btn-new-bill");
      navigationButton.addEventListener("click", newBill);
      fireEvent.click(navigationButton);
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
  });


});


// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetch bills from mock API GET", () => {
      // on indique que l'on se trouve sur la page Employe
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      const pathname = ROUTES_PATH["Bills"];
      root.innerHTML = ROUTES({ pathname: pathname, loading: true });
      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });
      bills.getBills().then((data) => {
        root.innerHTML = BillsUI({ data });
        expect(document.querySelector("tbody").rows.length).toBeGreaterThan(0);
      });
    });
  });

  describe("When an error occurs on API", () => {
    // avant chaque test
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
