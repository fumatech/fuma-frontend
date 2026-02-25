
$(document).ready(() => {
  const $table = $("#example1");

  if (!$table.length) return;
  if ($.fn.DataTable.isDataTable("#example1")) return;

  const headerCount = $table.find("thead tr:first th").length;
  const hasBodySpans =
    $table.find("tbody td[colspan], tbody td[rowspan], tbody th[colspan], tbody th[rowspan]").length > 0;

  const hasMismatchedRows = $table
    .find("tbody tr")
    .toArray()
    .some((row) => $(row).children("td,th").length !== headerCount);

  // DataTables crashes when tbody has colspan/rowspan or row cell count mismatches.
  if (!headerCount || hasBodySpans || hasMismatchedRows) {
    return;
  }

  try {
    $table.DataTable({
      responsive: true,
      lengthChange: true,
      autoWidth: true,
      searching: true,
      ordering: true,
      info: true,
      paging: true,
      dom: "Bfrtip",
    });
  } catch (error) {
    console.error("DataTable initialization skipped due to invalid table markup:", error);
  }
});
