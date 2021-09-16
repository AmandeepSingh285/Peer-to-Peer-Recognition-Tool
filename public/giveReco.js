$(".award").click(function(){
  var text_button=$(this).text();
  document.getElementById("remark").value += text_button;
});
