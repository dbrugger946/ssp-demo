const source = new EventSource("/decisions/stream");
source.onmessage = event => {
  const response = JSON.parse(event.data)

  const formatter = Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  for (var i=0; i < response["detections"].length ; i++ ) {
    var label = response["detections"][i].label;
    var score = response["detections"][i].score;
  

  $('#entries > tbody:first').append(`
    <tr class="table-light">
      <td>Algo Response</td>
      <td>${label}</td>
      <td>${formatter.format(score)}</td>
    </tr>
  `);
  }
  
  $('#entries').append('<tr class="table-active"> <td></td><td></td><td></td></tr>');
  $(document).scrollTop($(document).height());

};