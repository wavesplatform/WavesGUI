!macro customInstall
	File "${BUILD_RESOURCES_DIR}/Waves Client.visualelementsmanifest.xml"
	File "${BUILD_RESOURCES_DIR}/icons/tile*.png"
!macroend

!macro customUnInstall
	Delete "Waves Client.visualelementsmanifest.xml"
	Delete "tile*.png"
!macroend

