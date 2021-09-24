import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES } from "../constants/routes"
import userEvent from '@testing-library/user-event'
import firebase from "../__mocks__/firebase"



beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
    }))
})

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then new bill form should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy
    })
  })
  describe("when I click on button choose file and I add it", async() => {
    test("Then the file should be loaded", () => {
      const newBillsContainer = new NewBill({
        document, onNavigate, firestore: null, localStorage: window.localStorage
      })
      
      const html = NewBillUI()
      document.body.innerHTML = html

      const file = new File(['file'], 'file.png', { type: 'image/png' })

      const buttonChooseFile = screen.getByTestId("file")
      const handleChangeFile = jest.fn(newBillsContainer.handleChangeFile)
      buttonChooseFile.addEventListener("change", handleChangeFile)
      userEvent.upload(buttonChooseFile, file)
      expect(handleChangeFile).toHaveBeenCalled()
      expect(buttonChooseFile.files[0].name).toBe('file.png')
    })
  })
  describe("When I Submit form", () => {
    test("Then Bills page should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const newBillsContainer = new NewBill({
        document, onNavigate, firestore: null, localStorage: window.localStorage
      })

      const FormNewBill = screen.getByTestId('form-new-bill')

      const handleSubmit = jest.fn((e) => newBillsContainer.handleSubmit)
      FormNewBill.addEventListener("submit", handleSubmit)
      fireEvent.submit(FormNewBill)
      expect(handleSubmit).toHaveBeenCalled()
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
    })
  })
})

// test d'intégration POST Bills
describe("Given I am connected as Employee", () => {
  describe("When I send a new bill", () => {
    test("fetches bills from mock API POST", async () => {
      const newBill = {
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "séminaire",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "email": "a@a",
        "pct": 20
      }
 
      const postSpy = jest.spyOn(firebase, "post")
      const postBill = await firebase.post(newBill)
      expect(postSpy).toHaveBeenCalledTimes(1)
      expect(postBill).toBe("New Bill séminaire has been added")
    })
  })
})