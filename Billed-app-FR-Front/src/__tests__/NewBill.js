/**
 * @jest-environment jsdom
 */

import { screen, fireEvent  } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import BillsUI from '../views/BillsUI.js';
import NewBill from "../containers/NewBill.js"
import '@testing-library/jest-dom';

import { localStorageMock } from '../__mocks__/localStorage';
import store from "../__mocks__/store.js";
import firebase from '../__mocks__/firebase.js';
import { ROUTES } from '../constants/routes';



// init onNavigate
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};


describe("Given I am connected as an employee", () => {

  // on indique que l'on se trouve sur la page Employe
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    'user',
    JSON.stringify({
      type: 'Employee',
    })
  );

  describe("When I am on NewBill Page", () => {
    
    test("Then the newBill page should be rendered", () => {
      // création de la page NewBill
      const html = NewBillUI()
      document.body.innerHTML = html
      // on vérifie la présence du texte 'Envoyer une note de frais' sur la page
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
    })

    test('Then a form with nine fields should be rendered', () => {
      // création de la page NewBill
      const html = NewBillUI()
      document.body.innerHTML = html
      const form = document.querySelector('form');
      // on vérifie qu’il y a bien 9 champs dans le formulaire
      expect(form.length).toEqual(9);
    });

    test("Then mail icon in vertical layout should be highlighted", () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      document.getElementById("layout-icon1").classList.remove("active-icon");
      document.getElementById("layout-icon2").classList.add("active-icon");
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.classList.contains("active-icon")).toBeTruthy();
    });
  });

  describe("When I am on NewBill Page and I select an image in a correct format", () => {
    
    test("Then the input file should display the file name", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      fireEvent.change(input, {
        target: {
          files: [
            new File(["image.png"], "image.png", {
              type: "image/png",
            }),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(input.files[0].name).toBe("image.png");

    });

    test("Then a bill is created", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      const submit = screen.getByTestId("form-new-bill");
      submit.addEventListener("submit", handleSubmit);
      fireEvent.submit(submit);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });


  describe("When I select a file with an incorrect extension", () => {
    test("Then an error message is displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: store,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      fireEvent.change(input, {
        target: {
          files: [
            new File(["file.pdf"], "file.pdf", {
              type: "image/pdf",
            }),
          ],
        },
      });
      const errorMessage = document.querySelector(".errorMessageFile");
      expect(errorMessage).toHaveClass('displayed');
    });
  });

});


// test d'intégration POST
describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page and submit the form', () => {
    test('Then it should generate a new bill', async () => {

      // fonctions simulée avec spyOn
      const postSpy = jest.spyOn(firebase, 'post');

      // on crée une nouvelle facture
      const newBill = {
        id: '47qAXb6fIm2zOKkLzMro',
        vat: '80',
        fileUrl:
          'https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
        status: 'pending',
        type: 'Hôtel et logement',
        commentary: 'séminaire billed',
        name: 'fake new bill',
        fileName: 'preview-facture-free-201801-pdf-1.jpg',
        date: '2004-04-04',
        frenchDate: '04-04-2004',
        amount: 400,
        commentAdmin: 'ok',
        email: 'a@a',
        pct: 20,
      };

      // on récupère les factures et la nouvelle
      const bills = await firebase.post(newBill);

      // on vérifie que la fonction simulée postSpy soit appelée une fois
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(bills).toBe('fake new bill received');
    });


    test('Then the bill is added to the API but fails with 404 message error', async () => {

      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 404'))
      );

      // DOM construction
      document.body.innerHTML = BillsUI({ error: 'Erreur 404' });

      // on vérifie que le message d'erreur s'affiche bien
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test('then it posts to API and fails with 500 message error on Bills page', async () => {

      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error('Erreur 500'))
      );

      // DOM construction
      document.body.innerHTML = BillsUI({ error: 'Erreur 500' });

      // on vérifie que le message d'erreur s'affiche bien
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});

