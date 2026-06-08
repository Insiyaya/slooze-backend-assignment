import { gql } from 'graphql-request';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      accessToken id name role country
    }
  }
`;

export const GET_RESTAURANTS = gql`
  query {
    restaurants {
      id name cuisine address country rating
      menuItems { id name description price category available }
    }
  }
`;

export const GET_MY_ORDERS = gql`
  query {
    myOrders {
      id restaurantId status totalAmount paymentMethodId createdAt
      items { id menuItemId quantity unitPrice }
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($restaurantId: ID!, $items: [OrderItemInput!]!) {
    createOrder(input: { restaurantId: $restaurantId, items: $items }) {
      id status totalAmount
    }
  }
`;

export const PLACE_ORDER = gql`
  mutation PlaceOrder($orderId: ID!, $paymentMethodId: ID!) {
    placeOrder(orderId: $orderId, paymentMethodId: $paymentMethodId) {
      id status
    }
  }
`;

export const CANCEL_ORDER = gql`
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      id status
    }
  }
`;

export const GET_PAYMENT_METHODS = gql`
  query {
    myPaymentMethods { id type provider last4 isDefault }
  }
`;

export const ADD_PAYMENT_METHOD = gql`
  mutation AddPM($type: PaymentType!, $provider: String!, $last4: String, $isDefault: Boolean) {
    addPaymentMethod(input: { type: $type, provider: $provider, last4: $last4, isDefault: $isDefault }) {
      id type provider last4 isDefault
    }
  }
`;

export const UPDATE_PAYMENT_METHOD = gql`
  mutation UpdatePM($id: ID!, $isDefault: Boolean) {
    updatePaymentMethod(input: { id: $id, isDefault: $isDefault }) {
      id isDefault
    }
  }
`;

export const DELETE_PAYMENT_METHOD = gql`
  mutation DeletePM($id: ID!) {
    deletePaymentMethod(id: $id) { id }
  }
`;
