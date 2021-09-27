import { screen } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import LoadingPage from "../views/LoadingPage.js"
import ErrorPage from "../views/ErrorPage.js"
import Bills from "../containers/Bills.js"
import { ROUTES } from "../constants/routes"
import firebase from "../__mocks__/firebase"

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}

const firestore = null
const billsContainer = new Bills({
  document, onNavigate, firestore, localStorage: window.localStorage
})

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
    }))
})

describe("Given I am connected as an employee", () => {
  describe("When loading" , () => {
    test("Then when loading is true, LoadingPage should be called", () => {
      const loading = true
      const result = BillsUI({ data: bills, loading})

      expect(result).toEqual(LoadingPage())
    })
    test("Then when loading is false and error is true, ErrorPage should be called", () => {
      const loading = false
      const error = true
      const result = BillsUI({ data: bills, loading, error})

      expect(result).toEqual(ErrorPage(error))
    })
  })
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      const html = BillsUI({ data: []})
      document.body.innerHTML = html
      const billIcon = screen.getByTestId("icon-window")
      expect(billIcon.classList.contains("active-icon")).toBeTruthy
    })
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((new Date(a).getTime() < new Date(b).getTime()) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    describe("When I click on icon eye", () => {
      test("The modal should be displayed", () => {
        $.fn.modal = jest.fn()

        const html = BillsUI({ data: bills })
        document.body.innerHTML = html

        const eyeIcon = screen.getAllByTestId("icon-eye")[0]
        const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye)
        eyeIcon.addEventListener("click", handleClickIconEye(eyeIcon))
        userEvent.click(eyeIcon)
        expect(handleClickIconEye).toHaveBeenCalled()
        expect(screen.getByTestId("modaleFile")).toBeDefined()
      })
    })
    describe("When I click on buttonNewBill", () => {
      test("Then page new bill should be displayed", () => {
        const html = BillsUI({ data: bills })
        document.body.innerHTML = html

        const buttonNewBill = screen.getByTestId("btn-new-bill")

        const handleClickNewBill = jest.fn((e) => billsContainer.handleClickNewBill(e, bills[0]))
        buttonNewBill.addEventListener("click", handleClickNewBill)
        userEvent.click(buttonNewBill)
        expect(handleClickNewBill).toHaveBeenCalled();
        expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
      })
    })
  })
})

// test d'intégration GET Bills
describe("Given I am connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
       const getSpy = jest.spyOn(firebase, "get")
       const bills = await firebase.get()
       expect(getSpy).toHaveBeenCalledTimes(1)
       expect(bills.data.length).toBe(4)
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})