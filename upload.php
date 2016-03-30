<?php

$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
$uploadOk = 1;
$ERROR = 0;
$imageFileType = pathinfo($target_file,PATHINFO_EXTENSION);

//Allow only .mat file format
if($imageFileType != "mat" ) {
    $MESSAGE = "Sorry, only MAT files are allowed.";
    $ERROR = 1;
    $uploadOk = 0;
    ?>
    <script type='text/javascript'>
        var mes = <?php echo json_encode($MESSAGE); ?>;
        alert(mes);
        window.location.replace("index.html");
    </script>
    <?php 
    exit();
}

// Check file size
if ($_FILES["fileToUpload"]["size"] > 500000) {
    $MESSAGE = "Sorry, your file is too large.";
    $ERROR = 1;
    $uploadOk = 0;
    ?>
    <script type='text/javascript'>
        var mes = <?php echo json_encode($MESSAGE); ?>;
        alert(mes);
        window.location.replace("index.html");
    </script>
    <?php 
    exit();
}

//Upload the file
$value = $_POST["inputThr"];
if ((0 <= $value) && ($value <= 1)){
    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {

        $command = 'scripts/generateJavascript.py -t '.$_POST["inputThr"]. ' -i "uploads/'.basename($_FILES["fileToUpload"]["name"]).'"';
        $MESSAGE = shell_exec($command);
        if ($MESSAGE <> ""){
            $ERROR = 1;
        }
    } else {
        $MESSAGE = "Sorry, there was an error uploading your file.";
        $ERROR = 1;
    }
}else {
    $MESSAGE = "Sorry, the entered threshold must be between 0 and 1.";
    $ERROR = 1;
}

if($ERROR == 1){
    ?>
    <script type='text/javascript'>
        var mes = <?php echo json_encode($MESSAGE); ?>;
        alert(mes);
        window.location.replace("index.html");
    </script>
    <?php 
}
else{
?>

<!DOCTYPE html>
<meta charset="utf-8">
<head>
	<link rel="stylesheet" type="text/css" href="visual.css">
	<!-- Bootstrap core CSS -->
    <link href="bootstrap.min.css" rel="stylesheet">
    <!-- Custom styles for this template -->
    <link href="signin.css" rel="stylesheet">
</head>

<body>
<script src="http://d3js.org/d3.v3.min.js"></script>
<script src="scripts/visualization.js"></script>

<h1><?php echo $output ?></h1>

<p id="chart">
</p>

<div class="row">
<div class="col-md-1 text-center">
     <button class="btn btn-lg btn-primary btn-block" onclick="goBack()">Go Back</button>
</div> 
</div>

<script>
function goBack() {
    window.history.back();
}
</script>

<script>
	var jsonName = <?php echo '"uploads/'. substr(basename($_FILES["fileToUpload"]["name"]),0,-4). '.json"'; ?>;
	var threshold = <?php echo $_POST["inputThr"]; ?>;
    visualization(jsonName);
</script>
</body>
<?php } ?>
