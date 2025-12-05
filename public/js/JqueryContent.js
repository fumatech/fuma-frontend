
$(document).ready(() => {
  if (!$.fn.DataTable.isDataTable("#example1")) {
    $("#example1").DataTable({
      responsive: true,
      lengthChange: true,
      autoWidth: true,
      searching: true,
      ordering: true,
      info: true,
      autoWidth: true,
      responsive: true,
      paging: true,

      dom: "Bfrtip", // Adjust placement of buttons
    });
  }
});
