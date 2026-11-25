import SupplyRequestsView from '../../views/SupplyRequestsView.jsx'

export default function SupplyRequests() {
  return (
    <SupplyRequestsView
      canReview
      showSupplier
      emptyMessage="Requests appear here only for your assigned warehouses."
    />
  )
}

