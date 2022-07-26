port module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, class, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Http
import Json.Decode as D
import Json.Encode as E
import List.Extra
import Platform.Cmd as Cmd
import Url.Builder exposing (relative)



-- PORTS


port sendMessage : E.Value -> Cmd msg


port messageReceiver : (D.Value -> msg) -> Sub msg



-- MAIN


main =
    Browser.document
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias WorkElement =
    { kanji : String
    , keyword : String
    , notes : String
    }


type alias Model =
    { currentWork : WorkElement
    , workElements : List WorkElement
    , currentWorkIndex : Int
    , userMessages : Dict String String
    , submitWorkIndex : Int
    }


defaultCurrentWork =
    WorkElement "" "" ""


brokenCurrentWork =
    WorkElement "X" "Error" "An error occurred"


defaultModel =
    { currentWork = defaultCurrentWork
    , workElements = []
    , currentWorkIndex = 0
    , userMessages = Dict.empty
    , submitWorkIndex = 0
    }


defaultModelTwo =
    { defaultModel | workElements = [ WorkElement "a" "first" "", WorkElement "b" "" "asd", WorkElement "c" "third" "and comment" ] }


init : () -> ( Model, Cmd Msg )
init _ =
    -- ( model, Cmd.none )
    ( defaultModel, getWorkElements )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    messageReceiver RecvNewElementValue


portEncoder : WorkElement -> E.Value
portEncoder elem =
    E.object
        [ ( "kanji", E.string elem.kanji )
        , ( "keyword", E.string elem.keyword )
        , ( "notes", E.string elem.notes )
        ]


type alias MsgDecoded =
    { keyword : String, kanji : String, notes : String }


portDecoder : D.Decoder MsgDecoded
portDecoder =
    D.map3 MsgDecoded
        (D.field "keyword" D.string)
        (D.field "kanji" D.string)
        (D.field "notes" D.string)



-- UPDATE


type Msg
    = WorkElementsReady (Result Http.Error (List WorkElement))
    | SelectWorkElement Int
    | ElementSubmitReady (Result Http.Error String)
    | RecvNewElementValue D.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        WorkElementsReady result ->
            case result of
                Ok elements ->
                    let
                        newModel =
                            { model | workElements = elements }
                    in
                    update (SelectWorkElement newModel.currentWorkIndex) newModel

                Err httpError ->
                    -- HTTP error: do nothing, just report
                    let
                        message =
                            buildErrorMessage httpError

                        newUserMessages =
                            Dict.insert "WorkElementsReady" message model.userMessages
                    in
                    ( { model | userMessages = newUserMessages }, Cmd.none )

        SelectWorkElement index ->
            let
                selected =
                    Maybe.withDefault
                        (WorkElement "X" "Error" "An error occurred")
                        (List.Extra.getAt index model.workElements)

                newModel =
                    { model | currentWorkIndex = index, currentWork = selected }
            in
            ( newModel, sendMessage (portEncoder newModel.currentWork) )

        RecvNewElementValue jsonValue ->
            case D.decodeValue portDecoder jsonValue of
                Ok value ->
                    let
                        -- update current element
                        updatedElement =
                            WorkElement value.kanji value.keyword value.notes

                        updatedWorkElements =
                            List.Extra.setAt model.currentWorkIndex updatedElement model.workElements

                        -- select the next work element to display
                        index =
                            model.currentWorkIndex + 1

                        currentElement =
                            Maybe.withDefault
                                (WorkElement "X" "Error" "An error occurred")
                                (List.Extra.getAt index model.workElements)

                        newModel =
                            { model
                                | workElements = updatedWorkElements
                                , currentWorkIndex = index
                                , currentWork = currentElement
                                , submitWorkIndex = model.currentWorkIndex
                            }
                    in
                    -- send message with next work element, and post to backend
                    ( newModel, Cmd.batch [ sendMessage (portEncoder currentElement), submitElement updatedElement ] )

                Err _ ->
                    ( model, Cmd.none )

        ElementSubmitReady result ->
            case result of
                Ok body ->
                    if String.length body > 0 then
                        -- logical error: refresh all elements from db
                        let
                            message =
                                "Error submitting keyword. Details:" ++ body

                            newUserMessages =
                                Dict.insert "ElementSubmitReady" message model.userMessages

                            newModel =
                                { model | userMessages = newUserMessages, currentWorkIndex = model.submitWorkIndex }
                        in
                        ( newModel, getWorkElements )

                    else
                        ( { model | userMessages = Dict.empty }, Cmd.none )

                Err httpError ->
                    -- HTTP error: do nothing, just report
                    let
                        message =
                            buildErrorMessage httpError

                        newUserMessages =
                            Dict.insert "ElementSubmitReady" message model.userMessages

                        newModel =
                            { model | userMessages = newUserMessages, currentWorkIndex = model.submitWorkIndex }
                    in
                    ( newModel, Cmd.none )


buildErrorMessage : Http.Error -> String
buildErrorMessage httpError =
    case httpError of
        Http.BadUrl message ->
            message

        Http.Timeout ->
            "Server is taking too long to respond. Please try again later."

        Http.NetworkError ->
            "Unable to reach server."

        Http.BadStatus statusCode ->
            "Request failed with status code: " ++ String.fromInt statusCode

        Http.BadBody message ->
            message


getWorkElements : Cmd Msg
getWorkElements =
    Http.get
        { url = relative [ "api", "work" ] []
        , expect = Http.expectJson WorkElementsReady workElementsDecoder
        }


workElementsDecoder : D.Decoder (List WorkElement)
workElementsDecoder =
    D.list
        (D.map3 WorkElement
            (D.index 0 D.string)
            (D.index 1 D.string)
            (D.index 2 D.string)
        )


submitElement : WorkElement -> Cmd Msg
submitElement element =
    Http.post
        { url = relative [ "api", "submit" ] []
        , body = Http.jsonBody (submitElementEncoder element)
        , expect = Http.expectString ElementSubmitReady
        }


submitElementEncoder : WorkElement -> E.Value
submitElementEncoder element =
    E.object
        [ ( "kanji", E.string element.kanji )
        , ( "keyword", E.string element.keyword )
        , ( "notes", E.string element.notes )
        ]



-- VIEW


view : Model -> Document Msg
view model =
    Document "workelements" [ render model ]


renderSingleWorkElement : Model -> Int -> WorkElement -> Html Msg
renderSingleWorkElement model index elem =
    div
        [ style "padding" "2px 0"
        , style "display" "flex"
        , class "row"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
            ]
            [ text elem.kanji ]
        , span
            [ style "flex" "1 0 4rem"
            , style "margin" "0 0.5rem"
            , if String.length elem.keyword > 0 then
                style "background-color" "rgb(200, 210, 200)"

              else
                style "background-color" ""
            ]
            [ text elem.keyword ]
        , span
            [ style "flex" "10 1 auto"
            , if String.length elem.notes > 0 then
                style "background-color" "rgb(200, 200, 210)"

              else
                style "background-color" ""
            ]
            [ text elem.notes ]
        ]


{-| Parse `event.target.selectedOptions` and return option values.
targetSelectedOptions : Json.Decoder (List String)
targetSelectedOptions =
let
options =
Json.at [ "target", "selectedOptions" ] <|
Json.keyValuePairs <|
Json.field "value" Json.string
in
Json.map (List.map Tuple.second) options
-}
renderWorkElements : Model -> Html Msg
renderWorkElements model =
    let
        partial =
            renderSingleWorkElement model
    in
    div
        [ on "click" (D.map SelectWorkElement targetValueIntParse)
        ]
        (List.indexedMap partial model.workElements)


renderUserMessages : Model -> Html Msg
renderUserMessages model =
    div [] [ text (String.join "!" (Dict.values model.userMessages)) ]


render : Model -> Html Msg
render model =
    div
        [ style "background-color" "rgb(210, 210, 210)"
        , style "overflow" "auto"
        ]
        [ renderUserMessages model
        , div [] [ text "Work Elements" ]
        , renderWorkElements model
        ]
